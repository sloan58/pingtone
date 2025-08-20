<?php

namespace App\Jobs;

use SoapFault;
use Exception;
use App\Services\RisPort;
use App\Models\UcmCluster;
use App\Models\PhoneStatus;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class GatherPhoneStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected UcmCluster $ucmCluster,
        protected ?array     $phones = null
    )
    {
    }

    /**
     * @throws SoapFault
     */
    public function handle(): void
    {
        Log::info("Starting phone status gathering for UCM {$this->ucmCluster->name}", [
            'phone_count' => $this->phones ? count($this->phones) : 'all',
        ]);

        try {
            $risPortClient = new RisPort($this->ucmCluster);

            // Query phone status from RisPort API
            $risPortData = $risPortClient->queryPhoneStatus($this->phones);

            if (empty($risPortData)) {
                Log::info("No RisPort data received for UCM {$this->ucmCluster->name}");
                return;
            }

            // Store the complete RisPort response in the timeseries collection
            PhoneStatus::storeFromRisPortData($risPortData, $this->ucmCluster);

            Log::info("Successfully gathered and stored phone status for UCM {$this->ucmCluster->name}", [
                'ucm_cluster_id' => $this->ucmCluster->getKey(),
                'has_data' => !empty($risPortData['selectCmDeviceReturn']['SelectCmDeviceResult']['CmNodes'] ?? null),
                'total_devices_found' => $risPortData['selectCmDeviceReturn']['SelectCmDeviceResult']['TotalDevicesFound'] ?? 0,
            ]);

        } catch (Exception $e) {
            Log::error("Error gathering phone status for UCM {$this->ucmCluster->name}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ucm_cluster_id' => $this->ucmCluster->getKey(),
            ]);

            throw $e;
        }
    }
}
