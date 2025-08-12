<?php

namespace App\ApiClients;

use App\Models\Ucm;
use App\Models\PerfMonMetric;
use App\Models\PerfMonCounter;
use App\Models\PerfMonHost;
use SoapClient;
use SoapFault;
use Exception;
use Illuminate\Support\Facades\Log;

class PerfMonSoap extends SoapClient
{
    protected $logger;
    protected Ucm $ucm;
    protected ?string $sessionHandle = null;

    public function __construct(Ucm $ucm)
    {
        $this->logger = logger()->channel('perfmon');
        $this->ucm = $ucm;

        // Parse IP and port from UCM configuration
        $parts = explode(':', $this->ucm->ipAddress);
        $ip = count($parts) == 2 ? $parts[0] : $this->ucm->ipAddress;
        $port = count($parts) == 2 ? $parts[1] : '443';

        // PerfMon service runs on port 8443
        $wsdl = "https://{$ip}:8443/perfmonservice2/services/PerfmonService?wsdl";

        parent::__construct(
            $wsdl,
            [
                'trace' => true,
                'exceptions' => true,
                'location' => "https://{$ip}:8443/perfmonservice2/services/PerfmonService",
                'login' => $this->ucm->username,
                'password' => $this->ucm->password,
                'stream_context' => $this->ucm->verify_peer ?: stream_context_create([
                    'ssl' => [
                        'verify_peer' => false,
                        'verify_peer_name' => false,
                    ],
                ]),
                'features' => SOAP_SINGLE_ELEMENT_ARRAYS,
            ]
        );
    }

    /**
     * Open a PerfMon session
     */
    public function perfmonOpenSession(): ?string
    {
        try {
            $response = $this->__soapCall('perfmonOpenSession', []);
            
            if (isset($response->SessionHandle)) {
                $this->sessionHandle = $response->SessionHandle;
                $this->logger->info('PerfMon session opened', [
                    'ucm_id' => $this->ucm->id,
                    'session_handle' => $this->sessionHandle
                ]);
                return $this->sessionHandle;
            }
            
            return null;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to open PerfMon session', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Add counter to the session
     */
    public function perfmonAddCounter(string $sessionHandle, array $counters): bool
    {
        try {
            $arrayOfCounter = [];
            foreach ($counters as $counter) {
                $arrayOfCounter[] = [
                    'Name' => $counter['Name'] ?? '',
                    'Instance' => $counter['Instance'] ?? '',
                    'Host' => $counter['Host'] ?? '',
                    'Object' => $counter['Object'] ?? '',
                    'Counter' => $counter['Counter'] ?? ''
                ];
            }

            $response = $this->__soapCall('perfmonAddCounter', [
                'SessionHandle' => $sessionHandle,
                'ArrayOfCounter' => ['item' => $arrayOfCounter]
            ]);

            $this->logger->info('Added counters to PerfMon session', [
                'ucm_id' => $this->ucm->id,
                'session_handle' => $sessionHandle,
                'counter_count' => count($counters)
            ]);

            return true;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to add counters', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Collect counter data
     */
    public function perfmonCollectCounterData(string $sessionHandle, string $host = ''): ?array
    {
        try {
            $params = ['SessionHandle' => $sessionHandle];
            if (!empty($host)) {
                $params['Host'] = $host;
            }

            $response = $this->__soapCall('perfmonCollectCounterData', [$params]);

            if (isset($response->ArrayOfCounterValue->item)) {
                $items = is_array($response->ArrayOfCounterValue->item) 
                    ? $response->ArrayOfCounterValue->item 
                    : [$response->ArrayOfCounterValue->item];

                $this->logger->info('Collected counter data', [
                    'ucm_id' => $this->ucm->id,
                    'session_handle' => $sessionHandle,
                    'data_points' => count($items)
                ]);

                return $items;
            }

            return null;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to collect counter data', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Close PerfMon session
     */
    public function perfmonCloseSession(string $sessionHandle): bool
    {
        try {
            $this->__soapCall('perfmonCloseSession', [
                'SessionHandle' => $sessionHandle
            ]);

            $this->logger->info('PerfMon session closed', [
                'ucm_id' => $this->ucm->id,
                'session_handle' => $sessionHandle
            ]);

            $this->sessionHandle = null;
            return true;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to close PerfMon session', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * List available counters
     */
    public function perfmonListCounter(string $host = ''): ?array
    {
        try {
            $params = [];
            if (!empty($host)) {
                $params['Host'] = $host;
            }

            $response = $this->__soapCall('perfmonListCounter', [$params]);

            if (isset($response->ArrayOfObjectInfo->item)) {
                $items = is_array($response->ArrayOfObjectInfo->item) 
                    ? $response->ArrayOfObjectInfo->item 
                    : [$response->ArrayOfObjectInfo->item];

                $this->logger->info('Listed available counters', [
                    'ucm_id' => $this->ucm->id,
                    'object_count' => count($items)
                ]);

                return $items;
            }

            return null;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to list counters', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * List counter instances
     */
    public function perfmonListInstance(string $host, string $object): ?array
    {
        try {
            $response = $this->__soapCall('perfmonListInstance', [
                'Host' => $host,
                'Object' => $object
            ]);

            if (isset($response->ArrayOfInstanceInfo->item)) {
                $items = is_array($response->ArrayOfInstanceInfo->item) 
                    ? $response->ArrayOfInstanceInfo->item 
                    : [$response->ArrayOfInstanceInfo->item];

                $this->logger->info('Listed counter instances', [
                    'ucm_id' => $this->ucm->id,
                    'host' => $host,
                    'object' => $object,
                    'instance_count' => count($items)
                ]);

                return $items;
            }

            return null;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to list instances', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Query counter description
     */
    public function perfmonQueryCounterDescription(string $counter): ?string
    {
        try {
            $response = $this->__soapCall('perfmonQueryCounterDescription', [
                'Counter' => $counter
            ]);

            if (isset($response->Description)) {
                return $response->Description;
            }

            return null;
        } catch (SoapFault $e) {
            $this->logger->error('Failed to query counter description', [
                'ucm_id' => $this->ucm->id,
                'counter' => $counter,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Convenience method to collect and store metrics
     */
    public function collectAndStoreMetrics(array $counterConfigs, string $hostname): array
    {
        $sessionHandle = null;
        $results = [
            'success' => false,
            'metrics_collected' => 0,
            'errors' => []
        ];

        try {
            // Open session
            $sessionHandle = $this->perfmonOpenSession();
            if (!$sessionHandle) {
                throw new Exception('Failed to open PerfMon session');
            }

            // Prepare counters
            $counters = [];
            foreach ($counterConfigs as $config) {
                $instances = $config->instances ?? [''];
                foreach ($instances as $instance) {
                    $counters[] = [
                        'Name' => "{$config->object}\\{$config->counter}" . ($instance ? "\\{$instance}" : ''),
                        'Instance' => $instance,
                        'Host' => $hostname,
                        'Object' => $config->object,
                        'Counter' => $config->counter
                    ];
                }
            }

            // Add counters
            $this->perfmonAddCounter($sessionHandle, $counters);

            // Collect data
            $data = $this->perfmonCollectCounterData($sessionHandle, $hostname);

            if ($data) {
                $timestamp = now();
                foreach ($data as $item) {
                    try {
                        // Parse counter name
                        $parts = explode('\\', $item->Name);
                        $object = $parts[1] ?? '';
                        $counter = $parts[2] ?? '';
                        $instance = $parts[3] ?? '';

                        // Store metric
                        PerfMonMetric::create([
                            'ucm_id' => $this->ucm->id,
                            'timestamp' => $timestamp,
                            'host' => $hostname,
                            'object' => $object,
                            'counter' => $counter,
                            'instance' => $instance,
                            'value' => floatval($item->Value ?? 0),
                            'metadata' => [
                                'ucm_name' => $this->ucm->name,
                                'counter_status' => $item->CStatus ?? null
                            ]
                        ]);

                        $results['metrics_collected']++;
                    } catch (Exception $e) {
                        $results['errors'][] = "Failed to store metric {$item->Name}: " . $e->getMessage();
                    }
                }
            }

            $results['success'] = true;

        } catch (Exception $e) {
            $results['errors'][] = $e->getMessage();
        } finally {
            // Always close session
            if ($sessionHandle) {
                try {
                    $this->perfmonCloseSession($sessionHandle);
                } catch (Exception $e) {
                    $this->logger->warning('Failed to close session cleanly', [
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }

        return $results;
    }

    /**
     * Get default counters for initial setup
     */
    public static function getDefaultCounters(): array
    {
        return [
            [
                'object' => 'Processor',
                'counter' => '% CPU Time',
                'description' => 'CPU utilization percentage',
                'instances' => ['_Total'],
                'threshold_warning' => 70,
                'threshold_critical' => 90
            ],
            [
                'object' => 'Memory',
                'counter' => '% Mem Used',
                'description' => 'Memory utilization percentage',
                'instances' => [''],
                'threshold_warning' => 80,
                'threshold_critical' => 95
            ],
            [
                'object' => 'Process',
                'counter' => '% CPU Time',
                'description' => 'Process CPU utilization',
                'instances' => ['ccm', 'tomcat'],
                'threshold_warning' => 50,
                'threshold_critical' => 75
            ],
            [
                'object' => 'Cisco CallManager',
                'counter' => 'RegisteredHardwarePhones',
                'description' => 'Number of registered hardware phones',
                'instances' => ['']
            ],
            [
                'object' => 'Cisco CallManager',
                'counter' => 'CallsActive',
                'description' => 'Number of active calls',
                'instances' => ['']
            ],
            [
                'object' => 'Partition',
                'counter' => '% Used',
                'description' => 'Disk partition usage',
                'instances' => ['C:\\', 'active', 'inactive', 'common'],
                'threshold_warning' => 80,
                'threshold_critical' => 90
            ],
            [
                'object' => 'Network Interface',
                'counter' => 'Rx Packets',
                'description' => 'Network packets received',
                'instances' => ['eth0']
            ],
            [
                'object' => 'Network Interface',
                'counter' => 'Tx Packets',
                'description' => 'Network packets transmitted',
                'instances' => ['eth0']
            ]
        ];
    }
}
