<?php

namespace App\Jobs;

use App\Models\DeviceProfile;
use App\Models\UcmCluster;
use Exception;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SoapFault;

class SyncDeviceProfilesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected UcmCluster $ucmCluster)
    {
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
    public function handle(): void
    {
        $axlApi = $this->ucmCluster->axlApi();
        $start = now();

        $profiles = $axlApi->listUcmObjects(
            'listDeviceProfile',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => ''],
            ],
            'deviceProfile'
        );

        foreach ($profiles as $profile) {
            try {
                DeviceProfile::storeUcmDetails($axlApi->getDeviceProfileByName($profile['name']), $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get device profile failed: {$profile['name']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->deviceProfiles()->where('updated_at', '<', $start)->delete();
    }
}


