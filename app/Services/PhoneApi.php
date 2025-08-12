<?php

namespace App\Services;

use Exception;
use App\Models\Phone;
use App\Models\PhoneStatus;
use MongoDB\BSON\UTCDateTime;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

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
            // Make concurrent requests to both endpoints
            $responses = Http::pool(function ($pool) use ($ipAddress) {
                return [
                    $pool->as('network')->timeout($this->timeout)->get("http://{$ipAddress}/NetworkConfigurationX"),
                    $pool->as('config')->timeout($this->timeout)->get("http://{$ipAddress}/DeviceInformationX"),
                ];
            });

            $networkData = null;
            $configData = null;
            $errors = [];

            // Process network configuration response
            if ($responses['network']->successful()) {
                try {
                    $networkData = $this->xmlToArray($responses['network']->body());
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
                    $configData = $this->xmlToArray($responses['config']->body());
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

            $success = !empty($networkData) || !empty($configData);
            $errorMessage = !empty($errors) ? implode('; ', $errors) : null;

            return [
                'success' => $success,
                'error' => $errorMessage,
                'api_data' => [
                    'network' => $networkData,
                    'config' => $configData,
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
        $latestStatus = PhoneStatus::getLatestForPhone($phone->name, $phone->ucm);
        
        return $latestStatus?->device_data['IpAddress'] ?? null;
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
