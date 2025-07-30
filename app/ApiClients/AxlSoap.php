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
