<?php

namespace App\ApiClients;

use App\Models\Ucm;
use App\Models\Phone;
use App\Models\Risport;
use SoapClient;
use SoapFault;
use Exception;
use Illuminate\Support\Facades\Log;

class RisPortSoap extends SoapClient
{
    protected $logger;
    protected Ucm $ucm;

    public function __construct(Ucm $ucm)
    {
        $this->logger = logger()->channel('risport');
        $this->ucm = $ucm;

        // Parse IP and port from UCM configuration
        $parts = explode(':', $this->ucm->ipAddress);
        $ip = count($parts) == 2 ? $parts[0] : $this->ucm->ipAddress;
        $port = count($parts) == 2 ? $parts[1] : '443';

        // RISPort70 service runs on port 8443
        $wsdl = "https://{$ip}:8443/realtimeservice2/services/RISService70?wsdl";

        parent::__construct(
            $wsdl,
            [
                'trace' => true,
                'exceptions' => true,
                'location' => "https://{$ip}:8443/realtimeservice2/services/RISService70",
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
     * Select CM Device Extended - Get detailed device information
     */
    public function selectCmDeviceExt(array $deviceNames, array $options = []): ?array
    {
        try {
            // Build CmSelectionCriteria
            $selectionCriteria = [
                'MaxReturnedDevices' => $options['MaxReturnedDevices'] ?? 1000,
                'DeviceClass' => $options['DeviceClass'] ?? 'Phone',
                'Model' => $options['Model'] ?? 255, // Any model
                'Status' => $options['Status'] ?? 'Any',
                'NodeName' => $options['NodeName'] ?? '',
                'SelectBy' => $options['SelectBy'] ?? 'Name',
                'SelectItems' => [
                    'item' => []
                ],
                'Protocol' => $options['Protocol'] ?? 'Any',
                'DownloadStatus' => $options['DownloadStatus'] ?? 'Any'
            ];

            // Add device names to selection
            foreach ($deviceNames as $name) {
                $selectionCriteria['SelectItems']['item'][] = ['Item' => $name];
            }

            // If we have StateInfo from a previous query, use it
            if (isset($options['StateInfo'])) {
                $params = [
                    'StateInfo' => $options['StateInfo'],
                    'CmSelectionCriteria' => $selectionCriteria
                ];
            } else {
                $params = [
                    'CmSelectionCriteria' => $selectionCriteria
                ];
            }

            $response = $this->__soapCall('selectCmDeviceExt', [$params]);

            $this->logger->info('RISPort selectCmDeviceExt completed', [
                'ucm_id' => $this->ucm->id,
                'device_count' => count($deviceNames),
                'total_devices_found' => $response->SelectCmDeviceResult->TotalDevicesFound ?? 0
            ]);

            return $response;

        } catch (SoapFault $e) {
            $this->logger->error('RISPort selectCmDeviceExt failed', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage(),
                'fault_code' => $e->faultcode ?? null
            ]);
            throw $e;
        }
    }

    /**
     * Select CTI Item - Get CTI application information
     */
    public function selectCtiItem(array $options = []): ?array
    {
        try {
            $params = [
                'CtiSelectionCriteria' => [
                    'MaxReturnedItems' => $options['MaxReturnedItems'] ?? 1000,
                    'CtiMgrClass' => $options['CtiMgrClass'] ?? 'Provider',
                    'Status' => $options['Status'] ?? 'Any',
                    'NodeName' => $options['NodeName'] ?? '',
                    'SelectAppBy' => $options['SelectAppBy'] ?? 'AppId',
                    'AppItems' => $options['AppItems'] ?? ['item' => []],
                    'DevItems' => $options['DevItems'] ?? ['item' => []]
                ]
            ];

            // Add StateInfo if provided
            if (isset($options['StateInfo'])) {
                $params['StateInfo'] = $options['StateInfo'];
            }

            $response = $this->__soapCall('selectCtiItem', [$params]);

            $this->logger->info('RISPort selectCtiItem completed', [
                'ucm_id' => $this->ucm->id,
                'total_items_found' => $response->SelectCtiItemResult->TotalItemsFound ?? 0
            ]);

            return $response;

        } catch (SoapFault $e) {
            $this->logger->error('RISPort selectCtiItem failed', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get Service Status - Check RIS service status
     */
    public function getServiceStatus(): ?array
    {
        try {
            $response = $this->__soapCall('getServiceStatus', []);

            $this->logger->info('RISPort service status retrieved', [
                'ucm_id' => $this->ucm->id,
                'service_info' => $response->ServiceInfoList ?? []
            ]);

            return $response;

        } catch (SoapFault $e) {
            $this->logger->error('RISPort getServiceStatus failed', [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Convenience method to collect and store device data
     */
    public function collectAndStoreDeviceData(array $deviceNames, ?string $stateInfo = null): array
    {
        $results = [
            'success' => false,
            'devices_processed' => 0,
            'devices_registered' => 0,
            'devices_unregistered' => 0,
            'state_info' => null,
            'errors' => []
        ];

        try {
            $options = [];
            if ($stateInfo) {
                $options['StateInfo'] = $stateInfo;
            }

            $response = $this->selectCmDeviceExt($deviceNames, $options);

            // Store StateInfo for next query
            if (isset($response->StateInfo)) {
                $results['state_info'] = $response->StateInfo;
            }

            // Process CmNodes (cluster nodes)
            if (isset($response->SelectCmDeviceResult->CmNodes->item)) {
                $nodes = is_array($response->SelectCmDeviceResult->CmNodes->item) 
                    ? $response->SelectCmDeviceResult->CmNodes->item 
                    : [$response->SelectCmDeviceResult->CmNodes->item];

                foreach ($nodes as $node) {
                    if (!isset($node->CmDevices->item)) {
                        continue;
                    }

                    $devices = is_array($node->CmDevices->item) 
                        ? $node->CmDevices->item 
                        : [$node->CmDevices->item];

                    foreach ($devices as $device) {
                        try {
                            // Store or update device data
                            $risportData = Risport::storeFromApiResponse($device, $this->ucm->id, $node->Name ?? '');
                            
                            $results['devices_processed']++;
                            
                            if ($risportData->status === 'Registered') {
                                $results['devices_registered']++;
                            } else {
                                $results['devices_unregistered']++;
                            }

                        } catch (Exception $e) {
                            $results['errors'][] = "Failed to store device {$device->Name}: " . $e->getMessage();
                        }
                    }
                }
            }

            // Mark devices not in response as unregistered
            $devicesInResponse = [];
            if (isset($response->SelectCmDeviceResult->CmNodes->item)) {
                $nodes = is_array($response->SelectCmDeviceResult->CmNodes->item) 
                    ? $response->SelectCmDeviceResult->CmNodes->item 
                    : [$response->SelectCmDeviceResult->CmNodes->item];

                foreach ($nodes as $node) {
                    if (!isset($node->CmDevices->item)) {
                        continue;
                    }

                    $devices = is_array($node->CmDevices->item) 
                        ? $node->CmDevices->item 
                        : [$node->CmDevices->item];

                    foreach ($devices as $device) {
                        $devicesInResponse[] = $device->Name;
                    }
                }
            }

            // Mark missing devices as unregistered
            $missingDevices = array_diff($deviceNames, $devicesInResponse);
            foreach ($missingDevices as $deviceName) {
                try {
                    Risport::updateOrCreate(
                        [
                            'ucm_id' => $this->ucm->id,
                            'name' => $deviceName
                        ],
                        [
                            'status' => 'UnRegistered',
                            'timestamp' => now(),
                            'ip_address' => null,
                            'node_name' => null
                        ]
                    );
                    $results['devices_unregistered']++;
                    $results['devices_processed']++;
                } catch (Exception $e) {
                    $results['errors'][] = "Failed to mark device {$deviceName} as unregistered: " . $e->getMessage();
                }
            }

            $results['success'] = true;

        } catch (Exception $e) {
            $results['errors'][] = $e->getMessage();
        }

        return $results;
    }
}
