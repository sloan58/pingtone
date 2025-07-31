<?php

namespace App\Observers;

use App\Models\Ucm;
use App\Models\RecordingProfile;
use App\Models\VoicemailProfile;
use App\Models\PhoneModel;
use Illuminate\Support\Facades\Log;

class UcmObserver
{
    /**
     * Handle the Ucm "created" event.
     */
    public function created(Ucm $ucm): void
    {
        Log::info("UCM created", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "updated" event.
     */
    public function updated(Ucm $ucm): void
    {
        Log::info("UCM updated", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "deleted" event.
     */
    public function deleted(Ucm $ucm): void
    {
        echo "OBSERVER DEBUG: UCM deleted - {$ucm->id}\n";
        Log::info("UCM deleted, cleaning up related records", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);

        try {
            // Delete related recording profiles
            $recordingProfilesDeleted = RecordingProfile::where('ucm_id', $ucm->id)->delete();
            echo "OBSERVER DEBUG: Deleted {$recordingProfilesDeleted} recording profiles\n";
            Log::info("Deleted recording profiles", [
                'ucm_id' => $ucm->id,
                'count' => $recordingProfilesDeleted,
            ]);

            // Delete related voicemail profiles
            $voicemailProfilesDeleted = VoicemailProfile::where('ucm_id', $ucm->id)->delete();
            echo "OBSERVER DEBUG: Deleted {$voicemailProfilesDeleted} voicemail profiles\n";
            Log::info("Deleted voicemail profiles", [
                'ucm_id' => $ucm->id,
                'count' => $voicemailProfilesDeleted,
            ]);

            // Delete related phone models
            $phoneModelsDeleted = PhoneModel::where('ucm_id', $ucm->id)->delete();
            echo "OBSERVER DEBUG: Deleted {$phoneModelsDeleted} phone models\n";
            Log::info("Deleted phone models", [
                'ucm_id' => $ucm->id,
                'count' => $phoneModelsDeleted,
            ]);

            Log::info("UCM cleanup completed", [
                'ucm_id' => $ucm->id,
                'recording_profiles_deleted' => $recordingProfilesDeleted,
                'voicemail_profiles_deleted' => $voicemailProfilesDeleted,
                'phone_models_deleted' => $phoneModelsDeleted,
            ]);
        } catch (\Exception $e) {
            echo "OBSERVER ERROR: " . $e->getMessage() . "\n";
            Log::error("Error in UcmObserver::deleted", [
                'error' => $e->getMessage(),
                'ucm_id' => $ucm->id,
            ]);
        }
    }

    /**
     * Handle the Ucm "restored" event.
     */
    public function restored(Ucm $ucm): void
    {
        Log::info("UCM restored", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }

    /**
     * Handle the Ucm "force deleted" event.
     */
    public function forceDeleted(Ucm $ucm): void
    {
        Log::info("UCM force deleted", [
            'ucm_id' => $ucm->id,
            'name' => $ucm->name,
        ]);
    }
}
