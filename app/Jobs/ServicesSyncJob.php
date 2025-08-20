<?php

namespace App\Jobs;

use App\Models\UcmCluster;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Throwable;

class ServicesSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected UcmCluster $ucmCluster)
    {
    }

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        // Create batch of detail sync jobs
        $jobs = [
            new SyncPhonesDetailsJob($this->ucmCluster),
            new SyncDeviceProfilesDetailsJob($this->ucmCluster),
            new SyncRemoteDestinationProfilesDetailsJob($this->ucmCluster),
            new SyncRemoteDestinationsDetailsJob($this->ucmCluster),
            new SyncLinesDetailsJob($this->ucmCluster),
            new SyncIntercomsDetailsJob($this->ucmCluster),
        ];

        $cluster = UcmCluster::find($this->ucmCluster->id);

        Bus::batch($jobs)
            ->name("Services sync: {$this->ucmCluster->name}")
            ->catch(static function (Batch $batch, Throwable $e) use ($cluster) {
                Log::error("Services sync batch failed for {$cluster->name}: {$e->getMessage()}");
                throw $e;
            })
            ->dispatch();
    }
}


