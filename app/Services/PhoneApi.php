<?php

namespace App\Services;

use Exception;
use App\Models\Phone;
use App\Models\PhoneStatus;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use SimpleXMLElement;

/**
 * Phone API Client for Cisco IP Phones
 *
 * Clean, focused client for phone API operations with comprehensive error handling
 * and logging. Stores complete API responses for maximum data retention.
 */
class PhoneApi
{
    private int $timeout = 5; // Low timeout as requested
    private int $maxConcurrent = 50; // Limit concurrent requests

    /**
     * Gather device information and network configuration from phones
     *
     * @param array $phones Array of phones with IP addresses
     * @return array Complete API response data
     */
    public function gatherPhoneData(array $phones): array
    {
        $phonesWithIp = $this->filterPhonesWithIp($phones);
        
        Log::info("Gathering phone API data", [
            'total_phones' => count($phones),
            'phones_with_ip' => count($phonesWithIp),
        ]);

        if (empty($phonesWithIp)) {
            Log::info("No phones with IP addresses found");
            return [];
        }

        // Process phones in chunks to avoid overwhelming the system
        $chunkSize = $this->maxConcurrent;
        $allResults = [];
        
        foreach (array_chunk($phonesWithIp, $chunkSize) as $chunkIndex => $chunk) {
            Log::info("Processing phone chunk", [
                'chunk' => $chunkIndex + 1,
                'chunk_size' => count($chunk),
            ]);

            $chunkResults = $this->gatherPhoneChunkData($chunk);
            $allResults = array_merge($allResults, $chunkResults);
        }

        Log::info("Completed phone API data gathering", [
            'total_results' => count($allResults),
        ]);

        return $allResults;
    }

    /**
     * Gather data from a chunk of phones using concurrent requests
     *
     * @param array $phones Array of phones with IP addresses
     * @return array Complete API response data
     */
    private function gatherPhoneChunkData(array $phones): array
    {
        $requests = [];
        $phoneMap = [];

        // Prepare concurrent requests for each phone
        foreach ($phones as $phone) {
            $ip = $phone['ip_address'] ?? null;
            if (!$ip) {
                continue;
            }

            $phoneMap[$ip] = $phone;

            // Create concurrent requests for both endpoints
            $requests[] = [
                'url' => "http://{$ip}/DeviceInformationX",
                'phone' => $phone,
                'type' => 'device_info'
            ];

            $requests[] = [
                'url' => "http://{$ip}/NetworkConfigurationX",
                'phone' => $phone,
                'type' => 'network_config'
            ];
        }

        if (empty($requests)) {
            return [];
        }

        try {
            Log::info("Sending concurrent requests to phone APIs", [
                'request_count' => count($requests),
            ]);

            // Use Laravel's pool method for concurrent HTTP requests
            $responses = Http::pool(function ($pool) use ($requests) {
                $poolRequests = [];
                foreach ($requests as $index => $request) {
                    $poolRequests[] = $pool->as($index)->timeout($this->timeout)->get($request['url']);
                }
                return $poolRequests;
            });

            $results = [];

            foreach ($requests as $index => $request) {
                $response = $responses[$index];
                $phone = $request['phone'];
                $type = $request['type'];
                $ip = $phone['ip_address'];

                if ($response->successful()) {
                    try {
                        // Convert XML to array
                        $xmlData = $this->xmlToArray($response->body());
                        
                        $results[] = [
                            'phone_name' => $phone['name'],
                            'phone_id' => $phone['id'],
                            'ucm_id' => $phone['ucm_id'],
                            'ip_address' => $ip,
                            'api_type' => $type,
                            'data' => $xmlData,
                            'timestamp' => new \MongoDB\BSON\UTCDateTime(),
                            'success' => true,
                        ];

                        Log::debug("Successfully gathered {$type} data from phone", [
                            'phone' => $phone['name'],
                            'ip' => $ip,
                            'type' => $type,
                        ]);

                    } catch (Exception $e) {
                        Log::warning("Failed to parse XML response from phone", [
                            'phone' => $phone['name'],
                            'ip' => $ip,
                            'type' => $type,
                            'error' => $e->getMessage(),
                        ]);

                        $results[] = [
                            'phone_name' => $phone['name'],
                            'phone_id' => $phone['id'],
                            'ucm_id' => $phone['ucm_id'],
                            'ip_address' => $ip,
                            'api_type' => $type,
                            'data' => null,
                            'error' => $e->getMessage(),
                            'timestamp' => new \MongoDB\BSON\UTCDateTime(),
                            'success' => false,
                        ];
                    }
                } else {
                    Log::debug("Failed to get {$type} data from phone", [
                        'phone' => $phone['name'],
                        'ip' => $ip,
                        'type' => $type,
                        'status' => $response->status(),
                        'error' => $response->body(),
                    ]);

                    $results[] = [
                        'phone_name' => $phone['name'],
                        'phone_id' => $phone['id'],
                        'ucm_id' => $phone['ucm_id'],
                        'ip_address' => $ip,
                        'api_type' => $type,
                        'data' => null,
                        'error' => "HTTP {$response->status()}: {$response->body()}",
                        'timestamp' => new \MongoDB\BSON\UTCDateTime(),
                        'success' => false,
                    ];
                }
            }

            return $results;

        } catch (Exception $e) {
            Log::error("Error gathering phone chunk data", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return error results for all phones in this chunk
            $errorResults = [];
            foreach ($phones as $phone) {
                $ip = $phone['ip_address'] ?? null;
                if (!$ip) continue;

                foreach (['device_info', 'network_config'] as $type) {
                    $errorResults[] = [
                        'phone_name' => $phone['name'],
                        'phone_id' => $phone['id'],
                        'ucm_id' => $phone['ucm_id'],
                        'ip_address' => $ip,
                        'api_type' => $type,
                        'data' => null,
                        'error' => $e->getMessage(),
                        'timestamp' => new \MongoDB\BSON\UTCDateTime(),
                        'success' => false,
                    ];
                }
            }

            return $errorResults;
        }
    }

    /**
     * Filter phones that have IP addresses from PhoneStatus
     *
     * @param array $phones Array of phones
     * @return array Phones with IP addresses
     */
    private function filterPhonesWithIp(array $phones): array
    {
        $phonesWithIp = [];

        foreach ($phones as $phone) {
            // Get the latest phone status to check for IP address
            $latestStatus = PhoneStatus::getLatestForPhone($phone['name'], $phone['ucm_id']);
            
            if ($latestStatus && !empty($latestStatus->device_data['IpAddress'] ?? null)) {
                $phonesWithIp[] = [
                    'id' => $phone['id'],
                    'name' => $phone['name'],
                    'ucm_id' => $phone['ucm_id'],
                    'ip_address' => $latestStatus->device_data['IpAddress'],
                ];
            }
        }

        return $phonesWithIp;
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

    /**
     * Set the maximum number of concurrent requests
     *
     * @param int $maxConcurrent Maximum concurrent requests
     * @return self
     */
    public function setMaxConcurrent(int $maxConcurrent): self
    {
        $this->maxConcurrent = $maxConcurrent;
        return $this;
    }
}
