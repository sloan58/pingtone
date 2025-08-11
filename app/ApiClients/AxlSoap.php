<?php

namespace App\ApiClients;

use Exception;
use SoapFault;
use SoapClient;
use App\Models\Ucm;
use Illuminate\Support\Facades\Log;

/**
 * AXL SOAP Client for Cisco Unified Communications Manager
 *
 * Simple, focused client for AXL API operations with clean error handling
 * and logging. Built for reliability and maintainability.
 */
class AxlSoap extends SoapClient
{
    protected Ucm $ucm;

    // Pagination and retry tracking
    private bool $paginatingRequests = false;
    private int $skipRows = 0;
    private int $suggestedRows = 0;
    private int $loop = 0;
    private int $iterations = 0;
    private int $totalRows = 0;
    private int $tries = 0;
    private int $maxTries = 3;

    /**
     * @throws Exception
     */
    public function __construct(Ucm $ucm)
    {
        $this->ucm = $ucm;

        parent::__construct(
            $this->getWsdlPath(),
            $this->getSoapOptions()
        );
    }

    /**
     * Get the CCM version from the UCM
     * @return string|null
     * @throws Exception
     */
    public function getCCMVersion(): ?string
    {
        Log::info("Getting CCM version from {$this->ucm->name}", [
            'hostname' => $this->ucm->hostname,
            'username' => $this->ucm->username,
            'schema_version' => $this->ucm->schema_version,
            'wsdl_path' => $this->getWsdlPath(),
            'service_url' => $this->getServiceUrl(),
        ]);

        try {
            $res = $this->__soapCall('getCCMVersion', [
                'getCCMVersion' => []
            ]);

            $version = $res->return->componentVersion->version;
            Log::info("Successfully retrieved version: {$version}");

            return $version;

        } catch (SoapFault $e) {
            Log::error("SOAP fault getting CCM version", [
                'ucm' => $this->ucm->name,
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
                'debug_info' => $this->getDebugInfo(),
            ]);

            // For version detection, we don't want to retry indefinitely
            // Just log and return null
            return null;
        } catch (Exception $e) {
            Log::error("Unexpected error getting CCM version", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Generic method to list UCM objects and store them in MongoDB
     *
     * @param string $methodName The SOAP method name (e.g., 'listRecordingProfile')
     * @param array $listObject The search criteria and returned tags
     * @param string $responseProperty The property name in the response (e.g., 'recordingProfile')
     * @return array
     * @throws SoapFault
     */
    public function listUcmObjects(string $methodName, array $listObject, string $responseProperty): array
    {
        Log::info("{$this->ucm->name}: Syncing {$responseProperty}");

        // Add pagination parameters if we're in pagination mode
        if ($this->paginatingRequests) {
            $listObject['skipRecords'] = $this->skipRows;
            $listObject['first'] = $this->suggestedRows;
        }

        Log::info("{$this->ucm->name}: Set list object", $listObject);

        try {
            return json_decode(json_encode($this->__soapCall($methodName, [
                $methodName => $listObject
            ])->return->{$responseProperty} ?? []), true);
        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$methodName, $listObject, $responseProperty]);
        } catch (Exception $e) {
            Log::error("Unexpected error syncing {$responseProperty}", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle AXL API errors with retry logic and pagination support
     *
     * @param SoapFault $e
     * @param array|null $args
     * @return mixed
     * @throws SoapFault
     */
    public function handleAxlApiError(SoapFault $e, ?array $args = null): mixed
    {
        $method = debug_backtrace()[1]['function'];

        // Handle "Query request too large" errors with pagination
        if (str_contains($e->faultstring, 'Query request too large')) {
            Log::info("{$this->ucm->name}: Received throttle response - implementing pagination");
            preg_match_all('/[0-9]+/', $e->faultstring, $matches);
            if (count($matches[0]) >= 2) {
                $this->totalRows = (int)$matches[0][0];
                $this->suggestedRows = (int)floor($matches[0][1] / 5);
                $this->paginatingRequests = true;
                $this->iterations = (int)floor($this->totalRows / $this->suggestedRows) + 1;
                $this->loop = 1;
                Log::info("{$this->ucm->name}: Starting pagination", [
                    'totalRows' => $this->totalRows,
                    'suggestedRows' => $this->suggestedRows,
                    'iterations' => $this->iterations,
                ]);

                // Call the method multiple times and accumulate data
                $accumulatedData = [];
                while ($this->loop <= $this->iterations) {
                    Log::info("{$this->ucm->name}: Processing page {$this->loop} of {$this->iterations}", [
                        'skipRows' => $this->skipRows,
                        'suggestedRows' => $this->suggestedRows,
                    ]);

                    $data = $this->{$method}(...$args);
                    if (is_array($data)) {
                        $accumulatedData = array_merge($accumulatedData, $data);
                        Log::info("{$this->ucm->name}: Accumulated data", [
                            'current_count' => count($data),
                            'total_count' => count($accumulatedData),
                            'loop' => $this->loop,
                        ]);
                    }

                    $this->skipRows += $this->suggestedRows;
                    $this->loop++;
                }

                Log::info("{$this->ucm->name}: Pagination completed", [
                    'total_count' => count($accumulatedData),
                ]);

                $this->resetPagination();
                return $accumulatedData;
            }
        }

        // Check for authentication errors (don't retry these)
        if (str_contains($e->faultstring, 'Authentication failed') ||
            str_contains($e->faultstring, 'Invalid credentials') ||
            str_contains($e->faultstring, 'Access denied')) {
            Log::error("{$this->ucm->name}: Authentication error - not retrying", [
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
            ]);
            throw $e;
        }

        // Check for connection errors (retry with backoff)
        if (str_contains($e->faultstring, 'Connection refused') ||
            str_contains($e->faultstring, 'Connection timeout') ||
            str_contains($e->faultstring, 'Network is unreachable')) {
            Log::warning("{$this->ucm->name}: Connection error detected", [
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
                'tries' => $this->tries,
            ]);
        }

        // Handle other SOAP errors with exponential backoff
        Log::error("{$this->ucm->name}: Received AXL error response", [
            'faultcode' => $e->faultcode,
            'faultstring' => $e->faultstring,
            'tries' => $this->tries,
            'method' => $method,
        ]);

        $this->tries++;

        if ($this->tries > $this->maxTries) {
            Log::error("{$this->ucm->name}: Exceeded maximum retry attempts ({$this->maxTries})", [
                'method' => $method,
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
            ]);
            throw $e;
        }

        $sleepSeconds = $this->tries * 10; // Exponential backoff: 10s, 20s, 30s

        Log::info("{$this->ucm->name}: Retrying after {$sleepSeconds} seconds", [
            'maxTries' => $this->maxTries,
            'tries' => $this->tries,
            'sleep' => $sleepSeconds,
            'method' => $method,
        ]);

        sleep($sleepSeconds);

        // Retry the same operation
        return $this->{$method}(...$args);
    }

    /**
     * Reset pagination state after successful completion
     */
    private function resetPagination(): void
    {
        $this->skipRows = 0;
        $this->loop = 0;
        $this->paginatingRequests = false;
        $this->totalRows = 0;
        $this->iterations = 0;
        $this->tries = 0; // Reset retry counter on successful pagination
    }

    /**
     * Get the WSDL file path for the UCM's schema version
     * @throws Exception
     */
    private function getWsdlPath(): string
    {
        $path = storage_path("axl/{$this->ucm->schema_version}/AXLAPI.wsdl");

        if (!file_exists($path)) {
            throw new Exception("WSDL file not found for version {$this->ucm->schema_version}");
        }

        return $path;
    }

    /**
     * Get the AXL service URL
     */
    private function getServiceUrl(): string
    {
        // Use IP address directly to avoid DNS issues
        $hostname = $this->ucm->hostname;
        if (filter_var($hostname, FILTER_VALIDATE_IP)) {
            return "https://{$hostname}:8443/axl/";
        }

        // If it's a hostname, try to resolve it
        $ip = gethostbyname($hostname);
        if ($ip && $ip !== $hostname) {
            return "https://{$ip}:8443/axl/";
        }

        return "https://{$hostname}:8443/axl/";
    }

    /**
     * Get SOAP client options
     */
    private function getSoapOptions(): array
    {
        return [
            'trace' => true,                    // Essential for debugging
            'exceptions' => true,               // Let exceptions bubble up
            'login' => $this->ucm->username,    // Basic authentication
            'password' => $this->ucm->password,
            'cache_wsdl' => WSDL_CACHE_NONE,   // Always use fresh WSDL
            'connection_timeout' => 30,         // Reasonable timeout
            'features' => SOAP_SINGLE_ELEMENT_ARRAYS, // Critical for XML parsing
            'stream_context' => $this->getStreamContext(),
            'location' => $this->getServiceUrl(), // Explicitly set the service location
        ];
    }

    /**
     * Get stream context for SSL and timeout settings
     */
    private function getStreamContext()
    {
        return stream_context_create([
            'http' => [
                'timeout' => 30,
                'user_agent' => 'Pingtone-AXL-Client/1.0',
            ],
            'ssl' => [
                'verify_peer' => false,         // Handle self-signed certs
                'verify_peer_name' => false,
                'allow_self_signed' => true,
                'crypto_method' => STREAM_CRYPTO_METHOD_TLS_CLIENT,
                'ciphers' => 'DEFAULT',
                'security_level' => 0,
            ],
        ]);
    }

    /**
     * Execute a SQL query with pagination support
     *
     * @param string $sql
     * @return array
     * @throws SoapFault
     */
    public function performSqlQuery(string $sql): array
    {
        Log::info("{$this->ucm->name}: Executing SQL query: {$sql}");

        try {
            return json_decode(json_encode($this->executeSQLQuery( [
                'sql' => $this->formatSqlQuery($sql),
            ])->return->row), true);
        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$sql]);
        }
    }

    /**
     * Get full phone details by name (RPhone)
     * @throws SoapFault
     */
    public function getPhoneByName(string $name): array
    {
        try {
            $res = $this->__soapCall('getPhone', [
                'getPhone' => [
                    'name' => $name,
                ],
            ]);

            // Normalize to array
            return json_decode(json_encode($res->return->phone), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$name]);
        }
    }

    /**
     * Get full device profile details by name (RDeviceProfile)
     * @throws SoapFault
     */
    public function getDeviceProfileByName(string $name): array
    {
        try {
            $res = $this->__soapCall('getDeviceProfile', [
                'getDeviceProfile' => [
                    'name' => $name,
                ],
            ]);

            return json_decode(json_encode($res->return->deviceProfile), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$name]);
        }
    }

    /**
     * Get full UCM user details by userid or uuid (RUser)
     * @throws SoapFault
     */
    public function getUserByUserId(string $userid): array
    {
        try {
            $res = $this->__soapCall('getUser', [
                'getUser' => [
                    'userid' => $userid,
                ],
            ]);

            return json_decode(json_encode($res->return->user), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$userid]);
        }
    }

    /**
     * Get full line group details by name (RLineGroup)
     * @throws SoapFault
     */
    public function getLineGroupByName(string $name): array
    {
        try {
            $res = $this->__soapCall('getLineGroup', [
                'getLineGroup' => [
                    'name' => $name,
                ],
            ]);

            return json_decode(json_encode($res->return->lineGroup), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$name]);
        }
    }

    /**
     * Get full line details by uuid (RLine)
     * @throws SoapFault
     */
    public function getLineByUuid(string $uuid): array
    {
        try {
            $res = $this->__soapCall('getLine', [
                'getLine' => [
                    'uuid' => $uuid,
                ],
            ]);

            return json_decode(json_encode($res->return->line), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$uuid]);
        }
    }

    /**
     * Get full remote destination profile details by name (RRemoteDestinationProfile)
     * @throws SoapFault
     */
    public function getRemoteDestinationProfileByName(string $name): array
    {
        try {
            $res = $this->__soapCall('getRemoteDestinationProfile', [
                'getRemoteDestinationProfile' => [
                    'name' => $name,
                ],
            ]);

            return json_decode(json_encode($res->return->remoteDestinationProfile), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$name]);
        }
    }

    /**
     * Get full remote destination details by destination or uuid (RRemoteDestination)
     * @throws SoapFault
     */
    public function getRemoteDestinationByDestination(string $destination): array
    {
        try {
            $res = $this->__soapCall('getRemoteDestination', [
                'getRemoteDestination' => [
                    'destination' => $destination,
                ],
            ]);

            return json_decode(json_encode($res->return->remoteDestination), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$destination]);
        }
    }

    /**
     * Get full MOH audio source details by name
     * @throws SoapFault
     */
    public function getMohAudioSourceBySourceId(string $sourceId): array
    {
        try {
            $res = $this->__soapCall('getMohAudioSource', [
                'getMohAudioSource' => [
                    'sourceId' => $sourceId,
                ],
            ]);

            return json_decode(json_encode($res->return->mohAudioSource), true);

        } catch (SoapFault $e) {
            return $this->handleAxlApiError($e, [$sourceId]);
        }
    }

    /**
     * Format SQL query for pagination
     *
     * @param string $query
     * @return string
     */
    private function formatSqlQuery(string $query): string
    {
        if ($this->paginatingRequests) {
            return preg_replace(
                '/^SELECT\s(.*)/i',
                "SELECT SKIP {$this->skipRows} FIRST {$this->suggestedRows} $1",
                $query
            );
        }
        Log::info("{$this->ucm->name}: Running sql query", [$query]);
        return $query;
    }


    /**
     * Update a phone in UCM via AXL API
     *
     * @param array $updateObject The phone update object
     * @return array The response from UCM
     * @throws SoapFault
     */
    public function updatePhone(array $updateObject): array
    {
        try {
            Log::info("=== AXL UPDATE PHONE DETAILED ===", [
                'ucm' => $this->ucm->name,
                'phone_name' => $updateObject['name'] ?? 'unknown',
                'full_update_object' => $updateObject,
                'lines_data' => $updateObject['lines'] ?? 'No lines data',
                'buttons_data' => $updateObject['buttons'] ?? 'No buttons data',
            ]);

            $updateObject['addLines'] = $updateObject['lines'];

            // Application is not currently supporting MLPP
            unset($updateObject['confidentialAccess']);
            // userLocale needs to be an empty string if null
            $updateObject['userLocale'] = is_null($updateObject['userLocale']) ? '' : $updateObject['userLocale'];

            $res = $this->__soapCall('updatePhone', [
                'updatePhone' => $updateObject,
            ]);

            Log::info("Successfully updated phone in UCM", [
                'ucm' => $this->ucm->name,
                'phone_name' => $updateObject['name'] ?? 'unknown',
            ]);

            return json_decode(json_encode($res), true);

        } catch (SoapFault $e) {
            Log::error("Failed to update phone in UCM", [
                'ucm' => $this->ucm->name,
                'phone_name' => $updateObject['name'] ?? 'unknown',
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
                'debug_info' => $this->getDebugInfo(),
            ]);

            throw $e;
        }
    }

    /**
     * Get debug information for troubleshooting
     */
    public function getDebugInfo(): array
    {
        return [
            'last_request' => $this->__getLastRequest(),
            'last_response' => $this->__getLastResponse(),
            'last_request_headers' => $this->__getLastRequestHeaders(),
            'last_response_headers' => $this->__getLastResponseHeaders(),
        ];
    }
}
