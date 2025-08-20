<?php

namespace App\Services;

use App\Models\Phone;
use App\Models\PhoneStatus;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use MongoDB\BSON\UTCDateTime;

/**
 * Phone API Client for Cisco IP Phones
 *
 * Clean, focused client for phone API operations with comprehensive error handling
 * and logging. Stores API data directly on phone collection.
 */
class PhoneApi
{
    private int $timeout = 5;

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
                'ucm' => $phone->ucm->name,
            ]);

            return [
                'success' => false,
                'error' => 'No IP address available for this phone',
                'api_data' => [
                    'network' => null,
                    'config' => null,
                    'timestamp' => new UTCDateTime(),
                    'ip_address' => null,
                ],
            ];
        }

        Log::info("Gathering phone API data", [
            'phone' => $phone->name,
            'ip' => $ipAddress,
            'ucm' => $phone->ucm->name,
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

    /**
     * Get the IP address for a phone from its latest status
     *
     * @param Phone $phone
     * @return string|null
     */
    private function getPhoneIpAddress(Phone $phone): ?string
    {
        // Get the latest phone status to check for IP address
        $latestStatus = PhoneStatus::getLatestForPhone($phone->name, $phone->ucmCluster);

        return $latestStatus?->device_data['IPAddress']['item'][0]['IP'] ?? null;
    }

    /**
     * Convert XML string to array
     *
     * @param string $xmlString
     * @return array
     * @throws Exception
     */
    private function xmlToArray(string $xmlString): array
    {
        // Remove any BOM or encoding issues
        $xmlString = trim($xmlString);

        // Handle empty or invalid XML
        if (empty($xmlString)) {
            throw new Exception("Empty XML response");
        }

        // Suppress warnings for malformed XML
        $xml = @simplexml_load_string($xmlString);

        if ($xml === false) {
            throw new Exception("Failed to parse XML: " . libxml_get_last_error()?->message ?? "Unknown error");
        }

        // Convert SimpleXMLElement to array
        return json_decode(json_encode($xml), true);
    }



    /**
     * Set the timeout for API requests
     *
     * @param int $timeout Timeout in seconds
     * @return self
     */
    public function setTimeout(int $timeout): self
    {
        $this->timeout = $timeout;
        return $this;
    }
}
