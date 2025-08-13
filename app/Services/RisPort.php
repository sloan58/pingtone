<?php

namespace App\Services;

use Exception;
use SoapFault;
use SoapClient;
use App\Models\Ucm;
use Illuminate\Support\Facades\Log;

/**
 * RisPort SOAP Client for Cisco Unified Communications Manager
 *
 * Clean, focused client for RisPort API operations with comprehensive error handling
 * and logging. Stores complete API responses for maximum data retention.
 */
class RisPort extends SoapClient
{
    protected Ucm $ucm;

    // Retry tracking
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
     * Query phone status information from RisPort API
     *
     * @param array|null $phones Array of phone names to query, or null for all phones
     * @return array Complete API response data
     * @throws SoapFault
     */
    public function queryPhoneStatus(?array $phones = null): array
    {
        $phoneList = count($phones) ? $phones : $this->ucm->phones()->pluck('name')->toArray();

        Log::info("Querying phone status from RisPort", [
            'ucm' => $this->ucm->name,
            'phone_count' => count($phoneList),
        ]);

        if (empty($phoneList)) {
            Log::info("No phones to query for UCM {$this->ucm->name}");
            return [];
        }

        // Process phones in chunks to avoid overwhelming the API
        $chunkSize = 1000;
        $allResults = [];

        foreach (array_chunk($phoneList, $chunkSize) as $chunkIndex => $chunk) {
            Log::info("Processing phone chunk", [
                'ucm' => $this->ucm->name,
                'chunk' => $chunkIndex + 1,
                'chunk_size' => count($chunk),
            ]);

            $chunkResults = $this->queryPhoneChunk($chunk);
            $allResults = array_merge($allResults, $chunkResults);
        }

        Log::info("Completed phone status query", [
            'ucm' => $this->ucm->name,
            'total_results' => count($allResults),
        ]);

        return $allResults;
    }

    /**
     * Query a chunk of phones from RisPort API
     *
     * @param array $phones Array of phone names
     * @return array Complete API response data
     * @throws SoapFault
     */
    private function queryPhoneChunk(array $phones): array
    {
        // Build the SelectItems array for RisPort
        $selectItems = [];
        foreach ($phones as $phone) {
            $selectItems[] = ['Item' => $phone];
        }

        try {
            Log::info("Sending SelectCmDeviceExt request to RisPort", [
                'ucm' => $this->ucm->name,
                'phone_count' => count($phones),
            ]);

            $response = $this->__soapCall('SelectCmDeviceExt', [
                'SelectCmDeviceExt' => [
                    'StateInfo' => '',
                    'CmSelectionCriteria' => [
                        'MaxReturnedDevices' => '1000',
                        'DeviceClass' => 'Any',
                        'Model' => '255',
                        'Status' => 'Any',
                        'NodeName' => '',
                        'SelectBy' => 'Name',
                        'SelectItems' => $selectItems,
                    ],
                ],
            ]);

            // Convert response to array and return complete data
            $responseArray = json_decode(json_encode($response), true);

            Log::info("Successfully received RisPort response", [
                'ucm' => $this->ucm->name,
                'has_data' => !empty($responseArray['selectCmDeviceReturn']['SelectCmDeviceResult']['CmNodes'] ?? null),
                'total_devices_found' => $responseArray['selectCmDeviceReturn']['SelectCmDeviceResult']['TotalDevicesFound'] ?? 0,
            ]);

            return $responseArray;

        } catch (SoapFault $e) {
            return $this->handleRisPortApiError($e, [$phones]);
        } catch (Exception $e) {
            Log::error("Unexpected error querying RisPort", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle RisPort API errors with retry logic and rate limiting
     *
     * @param SoapFault $e
     * @param array|null $args
     * @return mixed
     * @throws SoapFault
     */
    public function handleRisPortApiError(SoapFault $e, ?array $args = null): mixed
    {
        $method = debug_backtrace()[1]['function'];

        // Handle rate limiting/throttling errors
        if (preg_match('/^AxisFault: Exceeded allowed rate for Reatime information/', $e->faultstring) ||
            str_contains($e->faultstring, 'rate limit') ||
            str_contains($e->faultstring, 'throttle')) {

            Log::warning("{$this->ucm->name}: Received throttle response from RisPort", [
                'faultstring' => $e->faultstring,
                'tries' => $this->tries,
            ]);

            if ($this->tries < $this->maxTries) {
                $sleepSeconds = ($this->tries + 1) * 30; // 30s, 60s, 90s
                Log::info("{$this->ucm->name}: Sleeping {$sleepSeconds} seconds before retry");
                sleep($sleepSeconds);

                $this->tries++;
                return $this->{$method}(...$args);
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
        Log::error("{$this->ucm->name}: Received RisPort error response", [
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
     * Get the WSDL file path for RisPort
     * @throws Exception
     */
    private function getWsdlPath(): string
    {
        // RisPort uses a different WSDL than AXL - it's typically available at the service URL
        return "https://{$this->ucm->hostname}/realtimeservice2/services/RISService70?wsdl";
    }

    /**
     * Get the RisPort service URL
     */
    private function getServiceUrl(): string
    {
        // Use IP address directly to avoid DNS issues
        $hostname = $this->ucm->hostname;
        if (filter_var($hostname, FILTER_VALIDATE_IP)) {
            return "https://{$hostname}/realtimeservice2/services/RISService70";
        }

        // If it's a hostname, try to resolve it
        $ip = gethostbyname($hostname);
        if ($ip && $ip !== $hostname) {
            return "https://{$ip}/realtimeservice2/services/RISService70";
        }

        return "https://{$hostname}/realtimeservice2/services/RISService70";
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
                'user_agent' => 'Pingtone-RisPort-Client/1.0',
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
