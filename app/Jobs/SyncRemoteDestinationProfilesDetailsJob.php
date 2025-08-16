<?php

namespace App\Jobs;

use Exception;
use App\Models\Ucm;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use App\Models\RemoteDestinationProfile;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncRemoteDestinationProfilesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

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


