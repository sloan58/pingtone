<?php

namespace App\Jobs;

use App\Models\Ucm;
use App\Models\SyncHistory;
use App\Enums\SyncStatusEnum;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncUcmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public $backoff = 60;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Ucm $ucm,
        protected SyncHistory $syncHistory
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting UCM sync job", [
            'ucm_id' => $this->ucm->id,
            'ucm_name' => $this->ucm->name,
            'sync_history_id' => $this->syncHistory->id,
        ]);

        try {
            // Update sync history to show we're starting
            $this->syncHistory->update([
                'status' => SyncStatusEnum::SYNCING,
            ]);

            // For now, just query the version to test the workflow
            // This will be expanded later with more comprehensive data collection
            $version = $this->ucm->updateVersionFromApi();

            if ($version) {
                Log::info("UCM sync completed successfully", [
                    'ucm_id' => $this->ucm->id,
                    'version' => $version,
                ]);

                // Mark sync as completed
                $this->syncHistory->update([
                    'sync_end_time' => now(),
                    'status' => SyncStatusEnum::COMPLETED,
                ]);

                // Update UCM's last sync time
                $this->ucm->update([
                    'last_sync_at' => now(),
                ]);
            } else {
                throw new \Exception('Version detection failed');
            }

        } catch (\Exception $e) {
            Log::error("UCM sync failed", [
                'ucm_id' => $this->ucm->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Mark sync as failed
            $this->syncHistory->update([
                'sync_end_time' => now(),
                'status' => SyncStatusEnum::FAILED,
                'error' => $e->getMessage(),
            ]);

            // Re-throw the exception to trigger job retry logic
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("UCM sync job failed permanently", [
            'ucm_id' => $this->ucm->id,
            'error' => $exception->getMessage(),
        ]);

        // Ensure sync history is marked as failed
        $this->syncHistory->update([
            'sync_end_time' => now(),
            'status' => SyncStatusEnum::FAILED,
            'error' => $exception->getMessage(),
        ]);
    }
} 