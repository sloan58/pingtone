<?php

namespace App\Jobs;

use Exception;
use App\Models\Ucm;
use App\Models\DeviceProfile;
use Illuminate\Bus\Queueable;
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncDeviceProfilesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
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
                DeviceProfile::storeUcmDetails($axlApi->getDeviceProfileByName($profile['name']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get device profile failed: {$profile['name']} - {$e->getMessage()}");
            }
        }

        $this->ucm->deviceProfiles()->where('updated_at', '<', $start)->delete();
    }
}


