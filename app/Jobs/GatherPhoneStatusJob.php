<?php

namespace App\Jobs;

use SoapFault;
use Exception;
use App\Models\Ucm;
use App\Models\PhoneStatus;
use App\Services\RisPort;
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
        protected Ucm $ucm,
        protected ?array $phones = null
    )
    {
    }

    /**
     * @throws SoapFault
     */
    public function handle(): void
    {
        Log::info("Starting phone status gathering for UCM {$this->ucm->name}", [
            'phone_count' => $this->phones ? count($this->phones) : 'all',
        ]);

        try {
            $risPortClient = new RisPort($this->ucm);

            // Query phone status from RisPort API
            $risPortData = $risPortClient->queryPhoneStatus($this->phones);

            if (empty($risPortData)) {
                Log::info("No RisPort data received for UCM {$this->ucm->name}");
                return;
            }

            // Store the complete RisPort response in the timeseries collection
            PhoneStatus::storeFromRisPortData($risPortData, $this->ucm);

            Log::info("Successfully gathered and stored phone status for UCM {$this->ucm->name}", [
                'ucm_id' => $this->ucm->getKey(),
                'has_data' => !empty($risPortData['selectCmDeviceReturn']['SelectCmDeviceResult']['CmNodes'] ?? null),
                'total_devices_found' => $risPortData['selectCmDeviceReturn']['SelectCmDeviceResult']['TotalDevicesFound'] ?? 0,
            ]);

        } catch (Exception $e) {
            Log::error("Error gathering phone status for UCM {$this->ucm->name}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ucm_id' => $this->ucm->getKey(),
            ]);

            throw $e;
        }
    }
}
