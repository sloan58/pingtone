<?php

namespace App\Jobs;

use App\Models\Ucm;
use App\Models\SyncHistory;
use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncUcmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Ucm $ucm,
        protected SyncHistory $syncHistory
    ) {
    }

    public function handle(): void
    {
        // Start the batch sync process
        StartUcmBatchSyncJob::dispatch($this->ucm->getKey());
        
        // Update sync history to completed
        $this->syncHistory->update([
            'sync_end_time' => now(),
            'status' => \App\Enums\SyncStatusEnum::COMPLETED,
        ]);
    }
}
