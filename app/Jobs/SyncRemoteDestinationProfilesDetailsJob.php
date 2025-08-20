<?php

namespace App\Jobs;

use App\Models\RemoteDestinationProfile;
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

class SyncRemoteDestinationProfilesDetailsJob implements ShouldQueue
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
                RemoteDestinationProfile::storeUcmDetails($axlApi->getRemoteDestinationProfileByName($rdp['name']), $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get RDP failed: {$rdp['name']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->remoteDestinationProfiles()->where('updated_at', '<', $start)->delete();
    }
}


