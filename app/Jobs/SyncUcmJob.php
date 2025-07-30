<?php

namespace App\Jobs;

use Throwable;
use Exception;
use App\Models\Ucm;
use App\Models\SyncHistory;
use App\Models\RecordingProfile;
use App\Models\VoicemailProfile;
use App\Models\PhoneModel;
use App\Enums\SyncStatusEnum;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;

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

            // Get the AXL API client
            $axlApi = $this->ucm->axlApi();
            
            // Reset retry state for new sync operation
            $axlApi->resetRetryState();

            // Update version first
            $version = $this->ucm->updateVersionFromApi();

            if (!$version) {
                throw new Exception('Version detection failed');
            }

            // Sync Recording Profiles
            $start = now();
            $axlApi->listUcmObjects(
                'listRecordingProfile',
                [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ],
                'recordingProfile',
                [RecordingProfile::class, 'storeUcmData']
            );
            $this->ucm->recordingProfiles()->where('updated_at', '<', $start)->delete();
            Log::info("{$this->ucm->name}: syncRecordingProfiles completed");

            // Sync Voicemail Profiles
            $start = now();
            $axlApi->listUcmObjects(
                'listVoicemailProfile',
                [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ],
                'voiceMailProfile',
                [VoicemailProfile::class, 'storeUcmData']
            );
            $this->ucm->voicemailProfiles()->where('updated_at', '<', $start)->delete();
            Log::info("{$this->ucm->name}: syncVoicemailProfiles completed");

            // Sync Phone Models (using SQL query)
            $start = now();
            $axlApi->executeSqlQuery(
                'SELECT name FROM typemodel WHERE tkclass = 1',
                [PhoneModel::class, 'storeUcmData']
            );
            $this->ucm->phoneModels()->where('updated_at', '<', $start)->delete();
            Log::info("{$this->ucm->name}: syncPhoneModels completed");

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

        } catch (Exception $e) {
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
    public function failed(Throwable $exception): void
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
