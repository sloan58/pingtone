<?php

namespace App\Jobs;

use App\Models\DeviceProfile;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncDeviceProfilesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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


