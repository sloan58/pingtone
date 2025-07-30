<?php

namespace App\ApiClients;

use DB;
use Exception;
use SoapFault;
use SoapClient;
use App\Models\Ucm;
use MongoDB\BSON\UTCDateTime;
use Illuminate\Support\Facades\Log;

/**
 * AXL SOAP Client for Cisco Unified Communications Manager
 *
 * Simple, focused client for AXL API operations with clean error handling
 * and logging. Built for reliability and maintainability.
 */
class AxlSoap extends SoapClient
{
    private Ucm $ucm;
    private string $wsdlPath;
    private string $serviceUrl;

    /**
     * @throws Exception
     */
    public function __construct(Ucm $ucm)
    {
        $this->ucm = $ucm;
        $this->wsdlPath = $this->getWsdlPath();
        $this->serviceUrl = $this->getServiceUrl();

        parent::__construct($this->wsdlPath, $this->getSoapOptions());
        $this->__setLocation($this->serviceUrl);
    }

    /**
     * Get CCM version from the UCM server
     */
    public function getCCMVersion(): ?string
    {
        try {
            Log::info("Getting CCM version from {$this->ucm->name}");

            $response = $this->__soapCall('getCCMVersion', [
                'getCCMVersion' => ['']
            ]);

            $version = $response->return->componentVersion->version ?? null;

            Log::info("Successfully retrieved version: {$version}");

            return $version;

        } catch (SoapFault $e) {
            Log::error("SOAP fault getting CCM version", [
                'ucm' => $this->ucm->name,
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
            ]);
            return null;
        } catch (Exception $e) {
            Log::error("Unexpected error getting CCM version", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
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
     * @param string $collectionName The MongoDB collection name
     * @param array $filterStructure The filter structure to use (e.g., ['ucm_id' => 'ucm_id', 'pkid' => 'pkid'])
     * @param array $hint The MongoDB index hint to use (e.g., ['ucm_id' => 1, 'pkid' => 1])
     * @return void
     * @throws SoapFault
     */
    public function listUcmObjects(string $methodName, array $listObject, string $responseProperty, string $collectionName, array $filterStructure, array $hint): void
    {
        Log::info("{$this->ucm->name}: Syncing {$responseProperty}");

        Log::info("{$this->ucm->name}: Set list object", $listObject);

        try {
            $res = $this->__soapCall($methodName, [
                $methodName => $listObject
            ]);

            Log::info("{$this->ucm->name}: Processing {$responseProperty} data");

            foreach ($res->return->{$responseProperty} as $record) {
                $recordArray = (array) $record;

                $update = [
                    ...$recordArray,
                    'ucm_id' => $this->ucm->id,
                    'updated_at' => new UTCDateTime(now())
                ];

                // Build filter using the specified structure
                $filter = array_map(function ($updateKey) use ($update) {
                    return $update[$updateKey];
                }, $filterStructure);

                $collection = DB::connection('mongodb')->getCollection($collectionName);
                $collection->updateOne($filter, ['$set' => $update], ['upsert' => true, 'hint' => $hint]);
            }

            if (!empty($res->return->{$responseProperty})) {
                Log::info("{$this->ucm->name}: Stored {$collectionName} data", [
                    'count' => count($res->return->{$responseProperty}),
                ]);
            }

            Log::info("{$this->ucm->name}: {$responseProperty} sync completed");

        } catch (SoapFault $e) {
            Log::error("SOAP fault syncing {$responseProperty}", [
                'ucm' => $this->ucm->name,
                'faultcode' => $e->faultcode,
                'faultstring' => $e->faultstring,
            ]);
            throw $e;
        } catch (Exception $e) {
            Log::error("Unexpected error syncing {$responseProperty}", [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
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
        return "https://{$this->ucm->hostname}:8443/axl/";
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
            ],
            'ssl' => [
                'verify_peer' => false,         // Handle self-signed certs
                'verify_peer_name' => false,
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
