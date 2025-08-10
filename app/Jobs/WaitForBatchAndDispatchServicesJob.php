<?php

namespace App\Jobs;

use App\Models\Ucm;
use Illuminate\Bus\BatchRepository;
use Illuminate\Bus\DatabaseBatchRepository;
use Illuminate\Bus\PendingBatch;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\BatchFactory;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;

class WaitForBatchAndDispatchServicesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, SerializesModels;

    public int $tries = 0; // keep retrying until done

    public function __construct(
        protected string $batchId,
        protected string $ucmId,
        protected int $pollSeconds = 10
    ) {}

    public function handle(): void
    {
        $batch = Bus::findBatch($this->batchId);
        if (!$batch) {
            // If batch not found, just dispatch services to avoid being stuck
            if ($ucm = Ucm::find($this->ucmId)) {
                ServicesSyncJob::dispatch($ucm);
            }
            return;
        }

        if ($batch->finished() && !$batch->cancelled()) {
            if ($ucm = Ucm::find($this->ucmId)) {
                ServicesSyncJob::dispatch($ucm);
            }
            return;
        }

        // Not finished yet; re-dispatch self after delay
        static::dispatch($this->batchId, $this->ucmId, $this->pollSeconds)->delay(now()->addSeconds($this->pollSeconds));
    }
}


