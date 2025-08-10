<?php

namespace App\Jobs;

use App\Models\RemoteDestinationProfile;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncRemoteDestinationProfilesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
        $start = now();

        $rdps = $axlApi->listUcmObjects(
            'listRemoteDestinationProfile',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => ''],
            ],
            'remoteDestinationProfile'
        );

        foreach ($rdps as $rdp) {
            try {
                RemoteDestinationProfile::storeUcmDetails($axlApi->getRemoteDestinationProfileByName($rdp['name']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get RDP failed: {$rdp['name']} - {$e->getMessage()}");
            }
        }

        $this->ucm->remoteDestinationProfiles()->where('updated_at', '<', $start)->delete();
    }
}


