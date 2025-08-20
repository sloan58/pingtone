<?php

namespace App\Jobs;

use App\Models\RemoteDestination;
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

class SyncRemoteDestinationsDetailsJob implements ShouldQueue
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

        $rds = $axlApi->listUcmObjects(
            'listRemoteDestination',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['destination' => ''],
            ],
            'remoteDestination'
        );

        foreach ($rds as $rd) {
            try {
                RemoteDestination::storeUcmDetails($axlApi->getRemoteDestinationByDestination($rd['destination']), $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get remote destination failed: {$rd['destination']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->remoteDestinations()->where('updated_at', '<', $start)->delete();
    }
}


