<?php

namespace App\Jobs;

use Exception;
use App\Models\Ucm;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use App\Models\RemoteDestination;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncRemoteDestinationsDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
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
                RemoteDestination::storeUcmDetails($axlApi->getRemoteDestinationByDestination($rd['destination']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get remote destination failed: {$rd['destination']} - {$e->getMessage()}");
            }
        }

        $this->ucm->remoteDestinations()->where('updated_at', '<', $start)->delete();
    }
}


