<?php

namespace App\Jobs;

use App\Models\RemoteDestination;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncRemoteDestinationsDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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


