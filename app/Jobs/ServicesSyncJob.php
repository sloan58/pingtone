<?php

namespace App\Jobs;

use Throwable;
use App\Models\Ucm;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class ServicesSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm)
    {
    }

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        // Create batch of detail sync jobs
        $jobs = [
            new SyncPhonesDetailsJob($this->ucm),
            new SyncDeviceProfilesDetailsJob($this->ucm),
            new SyncRemoteDestinationProfilesDetailsJob($this->ucm),
            new SyncRemoteDestinationsDetailsJob($this->ucm),
            new SyncLinesDetailsJob($this->ucm),
            new SyncIntercomsDetailsJob($this->ucm),
        ];

        $ucmId = $this->ucm->getKey();
        Bus::batch($jobs)
            ->name("Services sync: {$this->ucm->name}")
            ->then(static function (Batch $batch) use ($ucmId) {
                Log::info("Services sync batch completed, dispatching user assignment job");

                // Dispatch only the user assignment job first
                // The user assignment job will dispatch the device assignment job when it completes
                dispatch(new AssignUcmUsersToServiceAreasJob());
            })
            ->catch(static function (Batch $batch, Throwable $e) use ($ucmId) {
                $ucm = Ucm::find($ucmId);
                $name = $ucm?->name ?? $ucmId;
                Log::error("Services sync batch failed for {$name}: {$e->getMessage()}");
            })
            ->dispatch();
    }
}


