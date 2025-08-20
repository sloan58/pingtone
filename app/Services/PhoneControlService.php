<?php

namespace App\Services;

use Exception;
use App\Models\Phone;
use App\Models\PhoneStatus;
use Illuminate\Support\Arr;
use MongoDB\BSON\UTCDateTime;
use App\Models\PhoneScreenCapture;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

/**
 * Unified Phone Control Service for Cisco IP Phone CGI/Execute API
 *
 * This service consolidates all phone control operations including:
 * - Screen capture functionality
 * - Device information gathering
 * - CGI/Execute commands (button presses, background images, etc.)
 * - Phone status monitoring
 *
 * Maintains backward compatibility with existing PhoneScreenCaptureService and PhoneApi
 */
class PhoneControlService
{
    private int $timeout = 15;
    private bool $phoneViewError = false;

    // =============================================================================
    // SCREEN CAPTURE METHODS (migrated from PhoneScreenCaptureService)
    // =============================================================================

    /**
     * Capture a screenshot from the phone and save it.
     * @throws Exception
     */
    public function captureScreenshot(Phone $phone): PhoneScreenCapture
    {
        // Check if phone can perform screen capture
        if (!$phone->canScreenCapture()) {
            throw new Exception('Phone does not support screen capture or is not properly configured.');
        }

        // Validate phone has required properties
        if (!$phone->currentIpAddress) {
            throw new Exception('Phone does not have a valid IP address.');
        }

        if (!$phone->ucmCluster || !$phone->ucmCluster->username || !$phone->ucmCluster->password) {
            throw new Exception('Phone UCM credentials are not configured.');
        }

        // Assign phone to app user if needed
        $this->assignPhoneToAppUser($phone);

        if ($this->phoneViewError) {
            throw new Exception('Failed to associate user with phone for screen capture.');
        }

        // Create the storage directory for this phone
        $phoneDir = "phone-captures/{$phone->_id}";
        Storage::disk('public')->makeDirectory($phoneDir);

        // Generate filename with timestamp
        $filename = 'capture_' . now()->format('Y-m-d_H-i-s') . '.png';
        $filePath = "{$phoneDir}/{$filename}";

        try {
            // Make HTTP request to phone's screenshot endpoint
            $response = Http::timeout($this->timeout)
                ->withBasicAuth($phone->ucmCluster->username, $phone->ucmCluster->password)
                ->withHeaders([
                    'Accept' => 'application/octet-stream',
                    'User-Agent' => 'PingTone/1.0',
                ])
                ->get("http://{$phone->currentIpAddress}/CGI/Screenshot");

            if (!$response->successful()) {
                $statusCode = $response->status();
                if ($statusCode === 401) {
                    throw new Exception('Authentication failed. Please check UCM credentials.');
                } elseif ($statusCode === 404) {
                    throw new Exception('Screenshot endpoint not found. Phone may not support screen capture.');
                } else {
                    throw new Exception("Failed to capture screenshot. HTTP status: {$statusCode}");
                }
            }

            // Convert response body to base64 and save to file
            $base64Image = base64_encode($response->body());
            Storage::disk('public')->put($filePath, base64_decode($base64Image));

            // Verify the file was created and has content
            if (!Storage::disk('public')->exists($filePath)) {
                throw new Exception('Failed to save screenshot to storage.');
            }

            $fileSize = Storage::disk('public')->size($filePath);
            if ($fileSize === 0) {
                Storage::disk('public')->delete($filePath);
                throw new Exception('Screenshot file is empty.');
            }

            // Create database record
            $screenCapture = PhoneScreenCapture::create([
                'phone_id' => $phone->_id,
                'filename' => $filename,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'mime_type' => 'image/png',
                'captured_at' => now(),
                'captured_by' => auth()->user()->name
            ]);

            Log::info('Phone screen capture successful', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'filename' => $filename,
                'file_size' => $screenCapture->file_size,
            ]);

            return $screenCapture;

        } catch (Exception $e) {
            Log::error('Phone screen capture failed', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'ip_address' => $phone->currentIpAddress,
                'error' => $e->getMessage(),
            ]);

            // Clean up any partial files
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            throw $e;
        }
    }

    /**
     * Delete a screen capture and its associated file.
     */
    public function deleteScreenCapture(PhoneScreenCapture $screenCapture): bool
    {
        try {
            // Delete the file from storage
            if (Storage::disk('public')->exists($screenCapture->file_path)) {
                Storage::disk('public')->delete($screenCapture->file_path);
            }

            // Delete the database record
            $screenCapture->delete();

            Log::info('Phone screen capture deleted', [
                'phone_id' => $screenCapture->phone_id,
                'filename' => $screenCapture->filename,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Failed to delete phone screen capture', [
                'phone_id' => $screenCapture->phone_id,
                'filename' => $screenCapture->filename,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get all screen captures for a phone, ordered by capture date.
     */
    public function getScreenCaptures(Phone $phone): Collection
    {
        return $phone->screenCaptures()
            ->orderBy('captured_at', 'desc')
            ->get();
    }

    // =============================================================================
    // DEVICE INFORMATION METHODS (migrated from PhoneApi)
    // =============================================================================

    /**
     * Gather device information and network configuration for a single phone
     *
     * @param Phone $phone The phone to gather data for
     * @return array Complete API response data
     */
    public function gatherPhoneData(Phone $phone): array
    {
        $ipAddress = $this->getPhoneIpAddress($phone);

        if (!$ipAddress) {
            Log::warning("No IP address found for phone", [
                'phone' => $phone->name,
                'ucm' => $phone->ucmCluster->name,
            ]);

            return [
                'success' => false,
                'error' => 'No IP address available for this phone',
                'api_data' => [
                    'network' => null,
                    'config' => null,
                    'port' => null,
                    'log' => null,
                    'timestamp' => new UTCDateTime(),
                    'ip_address' => null,
                ],
            ];
        }

        Log::info("Gathering phone API data", [
            'phone' => $phone->name,
            'ip' => $ipAddress,
            'ucm' => $phone->ucmCluster->name,
        ]);

        try {
            // Make concurrent requests to all four endpoints
            $responses = Http::pool(function ($pool) use ($ipAddress) {
                return [
                    $pool->as('network')->timeout($this->timeout)->get("http://{$ipAddress}/NetworkConfigurationX"),
                    $pool->as('config')->timeout($this->timeout)->get("http://{$ipAddress}/DeviceInformationX"),
                    $pool->as('port')->timeout($this->timeout)->get("http://{$ipAddress}/PortInformationX?1"),
                    $pool->as('log')->timeout($this->timeout)->get("http://{$ipAddress}/DeviceLogX?1"),
                ];
            });

            $networkData = null;
            $configData = null;
            $portData = null;
            $logData = null;
            $errors = [];

            // Process network configuration response
            if ($responses['network']->successful()) {
                try {
                    $networkData = ['raw_xml' => $responses['network']->body()];
                    Log::debug("Successfully gathered network data from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                    ]);
                } catch (Exception $e) {
                    $errors[] = "Network config parsing failed: " . $e->getMessage();
                    Log::warning("Failed to parse network config XML from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                $errors[] = "Network config request failed: HTTP {$responses['network']->status()}";
                Log::debug("Failed to get network config from phone", [
                    'phone' => $phone->name,
                    'ip' => $ipAddress,
                    'status' => $responses['network']->status(),
                    'error' => $responses['network']->body(),
                ]);
            }

            // Process device information response
            if ($responses['config']->successful()) {
                try {
                    $configData = ['raw_xml' => $responses['config']->body()];
                    Log::debug("Successfully gathered device info from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                    ]);
                } catch (Exception $e) {
                    $errors[] = "Device info parsing failed: " . $e->getMessage();
                    Log::warning("Failed to parse device info XML from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                $errors[] = "Device info request failed: HTTP {$responses['config']->status()}";
                Log::debug("Failed to get device info from phone", [
                    'phone' => $phone->name,
                    'ip' => $ipAddress,
                    'status' => $responses['config']->status(),
                    'error' => $responses['config']->body(),
                ]);
            }

            // Process port information response
            if ($responses['port']->successful()) {
                try {
                    $portData = ['raw_xml' => $responses['port']->body()];
                    Log::debug("Successfully gathered port info from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                    ]);
                } catch (Exception $e) {
                    $errors[] = "Port info parsing failed: " . $e->getMessage();
                    Log::warning("Failed to parse port info XML from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                $errors[] = "Port info request failed: HTTP {$responses['port']->status()}";
                Log::debug("Failed to get port info from phone", [
                    'phone' => $phone->name,
                    'ip' => $ipAddress,
                    'status' => $responses['port']->status(),
                    'error' => $responses['port']->body(),
                ]);
            }

            // Process device log response
            if ($responses['log']->successful()) {
                try {
                    $logData = ['raw_xml' => $responses['log']->body()];
                    Log::debug("Successfully gathered device log from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                    ]);
                } catch (Exception $e) {
                    $errors[] = "Device log parsing failed: " . $e->getMessage();
                    Log::warning("Failed to parse device log XML from phone", [
                        'phone' => $phone->name,
                        'ip' => $ipAddress,
                        'error' => $e->getMessage(),
                    ]);
                }
            } else {
                $errors[] = "Device log request failed: HTTP {$responses['log']->status()}";
                Log::debug("Failed to get device log from phone", [
                    'phone' => $phone->name,
                    'ip' => $ipAddress,
                    'status' => $responses['log']->status(),
                    'error' => $responses['log']->body(),
                ]);
            }

            $success = !empty($networkData) || !empty($configData) || !empty($portData) || !empty($logData);
            $errorMessage = !empty($errors) ? implode('; ', $errors) : null;

            return [
                'success' => $success,
                'error' => $errorMessage,
                'api_data' => [
                    'network' => $networkData,
                    'config' => $configData,
                    'port' => $portData,
                    'log' => $logData,
                    'timestamp' => new UTCDateTime(),
                    'ip_address' => $ipAddress,
                ],
            ];

        } catch (Exception $e) {
            Log::error("Error gathering phone API data", [
                'phone' => $phone->name,
                'ip' => $ipAddress,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'api_data' => [
                    'network' => null,
                    'config' => null,
                    'port' => null,
                    'log' => null,
                    'timestamp' => new UTCDateTime(),
                    'ip_address' => $ipAddress,
                ],
            ];
        }
    }

    // =============================================================================
    // CGI/EXECUTE METHODS
    // =============================================================================

    /**
     * Execute a CGI command on the phone
     *
     * @param Phone $phone
     * @param string $command The CGI command to execute
     * @param array $parameters Optional parameters for the command
     * @return array Response data
     * @throws Exception
     */
    public function executeCommand(Phone $phone, string $command, array $parameters = []): array
    {
        $ipAddress = $this->getPhoneIpAddress($phone);

        if (!$ipAddress) {
            throw new Exception('Phone does not have a valid IP address.');
        }

        if (!$phone->ucmCluster || !$phone->ucmCluster->username || !$phone->ucmCluster->password) {
            throw new Exception('Phone UCM credentials are not configured.');
        }

        Log::info("Executing CGI command on phone", [
            'phone' => $phone->name,
            'ip' => $ipAddress,
            'command' => $command,
            'parameters' => $parameters,
        ]);

        try {
            $url = "http://{$ipAddress}/CGI/Execute";

            // Build query parameters
            $queryParams = array_merge(['XML' => $command], $parameters);

            $response = Http::timeout($this->timeout)
                ->withBasicAuth($phone->ucmCluster->username, $phone->ucmCluster->password)
                ->withHeaders([
                    'User-Agent' => 'PingTone/1.0',
                ])
                ->get($url, $queryParams);

            if (!$response->successful()) {
                $statusCode = $response->status();
                if ($statusCode === 401) {
                    throw new Exception('Authentication failed. Please check UCM credentials.');
                } elseif ($statusCode === 404) {
                    throw new Exception('CGI/Execute endpoint not found. Phone may not support this feature.');
                } else {
                    throw new Exception("Failed to execute command. HTTP status: {$statusCode}");
                }
            }

            Log::info("CGI command executed successfully", [
                'phone' => $phone->name,
                'command' => $command,
            ]);

            return [
                'success' => true,
                'response' => $response->body(),
                'status_code' => $response->status(),
            ];

        } catch (Exception $e) {
            Log::error("Failed to execute CGI command", [
                'phone' => $phone->name,
                'ip' => $ipAddress,
                'command' => $command,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Press a button on the phone
     *
     * @param Phone $phone
     * @param string $button Button identifier (e.g., 'Soft1', 'Line1', 'Settings')
     * @return array Response data
     * @throws Exception
     */
    public function pressButton(Phone $phone, string $button): array
    {
        return $this->executeCommand($phone, "<CiscoIPPhoneExecute><ExecuteItem Priority=\"0\" URL=\"Key:{$button}\"/></CiscoIPPhoneExecute>");
    }

    /**
     * Push a background image to the phone
     *
     * @param Phone $phone
     * @param string $imageUrl URL to the background image
     * @return array Response data
     * @throws Exception
     */
    public function pushBackgroundImage(Phone $phone, string $imageUrl): array
    {
        return $this->executeCommand($phone, "<CiscoIPPhoneImageFile><URL>{$imageUrl}</URL></CiscoIPPhoneImageFile>");
    }

    /**
     * Reboot the phone
     *
     * @param Phone $phone
     * @return array Response data
     * @throws Exception
     */
    public function rebootPhone(Phone $phone): array
    {
        return $this->executeCommand($phone, "<CiscoIPPhoneExecute><ExecuteItem Priority=\"0\" URL=\"Init:Reboot\"/></CiscoIPPhoneExecute>");
    }

    /**
     * Reset the phone to factory defaults
     *
     * @param Phone $phone
     * @return array Response data
     * @throws Exception
     */
    public function factoryResetPhone(Phone $phone): array
    {
        return $this->executeCommand($phone, "<CiscoIPPhoneExecute><ExecuteItem Priority=\"0\" URL=\"Init:Reset\"/></CiscoIPPhoneExecute>");
    }

    /**
     * Display a text message on the phone screen
     *
     * @param Phone $phone
     * @param string $title Message title
     * @param string $text Message content
     * @param int $duration Duration in seconds (0 = until dismissed)
     * @return array Response data
     * @throws Exception
     */
    public function displayMessage(Phone $phone, string $title, string $text, int $duration = 0): array
    {
        $xml = "<CiscoIPPhoneText>";
        $xml .= "<Title>{$title}</Title>";
        $xml .= "<Text>{$text}</Text>";
        if ($duration > 0) {
            $xml .= "<SoftKeyItem><Name>OK</Name><URL>SoftKey:Exit</URL><Position>1</Position></SoftKeyItem>";
        }
        $xml .= "</CiscoIPPhoneText>";

        return $this->executeCommand($phone, $xml);
    }

    /**
     * Common button press shortcuts
     */
    public function pressLineButton(Phone $phone, int $lineNumber): array
    {
        return $this->pressButton($phone, "Line{$lineNumber}");
    }

    public function pressSoftKey(Phone $phone, int $softKeyNumber): array
    {
        return $this->pressButton($phone, "Soft{$softKeyNumber}");
    }

    public function pressSettingsButton(Phone $phone): array
    {
        return $this->pressButton($phone, "Settings");
    }

    public function pressDirectoriesButton(Phone $phone): array
    {
        return $this->pressButton($phone, "Directories");
    }

    public function pressServicesButton(Phone $phone): array
    {
        return $this->pressButton($phone, "Services");
    }

    public function pressNavigationUp(Phone $phone): array
    {
        return $this->pressButton($phone, "NavUp");
    }

    public function pressNavigationDown(Phone $phone): array
    {
        return $this->pressButton($phone, "NavDown");
    }

    public function pressNavigationLeft(Phone $phone): array
    {
        return $this->pressButton($phone, "NavLeft");
    }

    public function pressNavigationRight(Phone $phone): array
    {
        return $this->pressButton($phone, "NavRight");
    }

    public function pressNavigationSelect(Phone $phone): array
    {
        return $this->pressButton($phone, "NavSelect");
    }

    // =============================================================================
    // PRIVATE HELPER METHODS
    // =============================================================================

    /**
     * Get the IP address for a phone from its latest status
     */
    private function getPhoneIpAddress(Phone $phone): ?string
    {
        // Get the latest phone status to check for IP address
        $latestStatus = PhoneStatus::getLatestForPhone($phone->name, $phone->ucmClusterCluster);

        return $latestStatus?->device_data['IPAddress']['item'][0]['IP'] ?? null;
    }

    /**
     * Assign phone to app user for screen capture access
     */
    private function assignPhoneToAppUser(Phone $phone): void
    {
        // Check if user is already associated with the phone
        $ucmUser = $phone->ucmCluster->ucmUsers()
            ->where('userid', $phone->ucmCluster->username)
            ->first();

        if ($ucmUser && isset($ucmUser->associatedDevices['device'])) {
            $deviceList = Arr::wrap($ucmUser->associatedDevices['device']);
            if (in_array($phone->name, $deviceList)) {
                Log::info('User already associated with phone for screen capture', [
                    'phone_id' => $phone->_id,
                    'phone_name' => $phone->name,
                    'username' => $phone->ucmCluster->username,
                ]);
                return;
            }
        }

        // Wait for any existing phone view operations to complete
        while (Cache::has("phone-view-{$phone->ucmCluster->id}")) {
            sleep(1);
        }

        // Set cache lock to prevent race conditions
        Cache::put("phone-view-{$phone->ucmCluster->id}", true, 30);

        try {
            // Get current associated devices
            $res = $phone->ucmCluster->axlApi()->getAppUser([
                'userid' => $phone->ucmCluster->username,
                'returnedTags' => [
                    'associatedDevices' => ''
                ]
            ]);

            $deviceList = Arr::wrap($res->associatedDevices->device ?? []);
            $deviceList[] = $phone->name;

            // Update user with new device list
            $phone->ucmCluster->axlApi()->updateAppUser([
                'userid' => $phone->ucmCluster->username,
                'associatedDevices' => [
                    'device' => $deviceList
                ]
            ]);

            Log::info('Successfully associated user with phone for screen capture', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'username' => $phone->ucmCluster->username,
            ]);

        } catch (Exception $e) {
            Log::error('Could not assign user for phone view', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'username' => $phone->ucmCluster->username,
                'line' => $e->getLine(),
                'message' => $e->getMessage(),
            ]);
            $this->phoneViewError = true;
        } finally {
            // Remove cache lock
            Cache::forget("phone-view-{$phone->ucmCluster->id}");

            // Allow user association to propagate
            sleep(1);
        }
    }

    /**
     * Set the timeout for API requests
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;
        return $this;
    }
}
