<?php

namespace App\Jobs;

use App\Models\Ucm;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ServicesSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        SyncPhonesDetailsJob::dispatch($this->ucm);
        SyncDeviceProfilesDetailsJob::dispatch($this->ucm);
        SyncRemoteDestinationProfilesDetailsJob::dispatch($this->ucm);
        SyncRemoteDestinationsDetailsJob::dispatch($this->ucm);
        SyncLinesDetailsJob::dispatch($this->ucm);
        SyncIntercomsDetailsJob::dispatch($this->ucm);
    }
}


