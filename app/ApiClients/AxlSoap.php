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

        // Initialize accumulated data array
        $accumulatedData = [];

        // Add pagination parameters if we're in pagination mode
        if ($this->paginatingRequests) {
            $listObject['skipRecords'] = $this->skipRows;
            $listObject['first'] = $this->suggestedRows;
        }

        Log::info("{$this->ucm->name}: Set list object", $listObject);

        try {
            $res = $this->__soapCall($methodName, [
                $methodName => $listObject
            ]);

            Log::info("{$this->ucm->name}: Processing {$responseProperty} data");

            if (isset($res->return->{$responseProperty})) {
                $data = $res->return->{$responseProperty};
                
                // If we're paginating, accumulate the data
                if ($this->paginatingRequests) {
                    $accumulatedData = array_merge($accumulatedData, $data);
                    Log::info("{$this->ucm->name}: Accumulated {$responseProperty} data", [
                        'current_count' => count($data),
                        'total_count' => count($accumulatedData),
                    ]);
                } else {
                    // Not paginating, return the data directly
                    Log::info("{$this->ucm->name}: {$responseProperty} sync completed", [
                        'count' => count($data),
                    ]);
                    return $data;
                }
            }

            // If we're paginating, continue until all data is collected
            if ($this->paginatingRequests) {
                while ($this->loop <= $this->iterations) {
                    $this->skipRows += $this->suggestedRows;
                    $this->loop++;
                    
                    $listObject['skipRecords'] = $this->skipRows;
                    $listObject['first'] = $this->suggestedRows;
                    
                    $res = $this->__soapCall($methodName, [
                        $methodName => $listObject
                    ]);
                    
                    if (isset($res->return->{$responseProperty})) {
                        $data = $res->return->{$responseProperty};
                        $accumulatedData = array_merge($accumulatedData, $data);
                        
                        Log::info("{$this->ucm->name}: Accumulated {$responseProperty} data", [
                            'current_count' => count($data),
                            'total_count' => count($accumulatedData),
                            'loop' => $this->loop,
                        ]);
                    }
                }
                
                $this->resetPagination();
                Log::info("{$this->ucm->name}: {$responseProperty} pagination completed", [
                    'total_count' => count($accumulatedData),
                ]);
                return $accumulatedData;
            }

            return [];

        } catch (SoapFault $e) {
            $this->handleAxlApiError($e, [$methodName, $listObject, $responseProperty]);
        } catch (Exception $e) {
            Log::error("Unexpected error syncing {$responseProperty}", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle AXL API Errors
     * Determine if we should throttle, paginate, or retry with backoff
     *
     * @param SoapFault $e
     * @param array|null $args
     * @return void
     * @throws SoapFault
     */
    public function handleAxlApiError(SoapFault $e, array $args = null): void
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
                
                // Let the method handle the pagination internally
                $this->{$method}(...$args);
                return;
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
        $this->{$method}(...$args);
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
     * Reset retry state for new operations
     * Call this before starting a new sync operation
     */
    public function resetRetryState(): void
    {
        $this->tries = 0;
        $this->resetPagination();
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
     * Execute SQL query and pass results to callback
     *
     * @param string $sql The SQL query to execute
     * @param callable $dataHandler The callback to handle the data
     * @return void
     * @throws SoapFault
     */
    public function executeSqlQuery(string $sql): array
    {
        Log::info("{$this->ucm->name}: Executing SQL query: {$sql}");

        // Initialize accumulated data array
        $accumulatedData = [];

        // Format SQL query with pagination if needed
        $formattedSql = $this->formatSqlQuery($sql);

        try {
            $res = $this->__soapCall('executeSQLQuery', [
                'executeSQLQuery' => [
                    'sql' => $formattedSql,
                ]
            ]);

            Log::info("{$this->ucm->name}: Processing SQL query results");

            if (isset($res->return->row)) {
                $data = $res->return->row;
                
                // If we're paginating, accumulate the data
                if ($this->paginatingRequests) {
                    $accumulatedData = array_merge($accumulatedData, $data);
                    Log::info("{$this->ucm->name}: Accumulated SQL query data", [
                        'current_count' => count($data),
                        'total_count' => count($accumulatedData),
                    ]);
                } else {
                    // Not paginating, return the data directly
                    Log::info("{$this->ucm->name}: SQL query execution completed", [
                        'count' => count($data),
                    ]);
                    return $data;
                }
            }

            // If we're paginating, continue until all data is collected
            if ($this->paginatingRequests) {
                while ($this->loop <= $this->iterations) {
                    $this->skipRows += $this->suggestedRows;
                    $this->loop++;
                    
                    $formattedSql = $this->formatSqlQuery($sql);
                    
                    $res = $this->__soapCall('executeSQLQuery', [
                        'executeSQLQuery' => [
                            'sql' => $formattedSql,
                        ]
                    ]);
                    
                    if (isset($res->return->row)) {
                        $data = $res->return->row;
                        $accumulatedData = array_merge($accumulatedData, $data);
                        
                        Log::info("{$this->ucm->name}: Accumulated SQL query data", [
                            'current_count' => count($data),
                            'total_count' => count($accumulatedData),
                            'loop' => $this->loop,
                        ]);
                    }
                }
                
                $this->resetPagination();
                Log::info("{$this->ucm->name}: SQL query pagination completed", [
                    'total_count' => count($accumulatedData),
                ]);
                return $accumulatedData;
            }

            return [];

        } catch (SoapFault $e) {
            $this->handleAxlApiError($e, [$sql]);
        } catch (Exception $e) {
            Log::error("Unexpected error executing SQL query", [
                'ucm' => $this->ucm->name,
                'sql' => $sql,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Format SQL query with pagination parameters if needed
     *
     * @param string $query The original SQL query
     * @return string The formatted SQL query
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
        return $query;
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
