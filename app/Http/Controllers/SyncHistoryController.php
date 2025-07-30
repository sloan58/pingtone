<?php

namespace App\Http\Controllers;

use App\Models\Ucm;
use App\Models\SyncHistory;
use App\Jobs\SyncUcmJob;
use App\Enums\SyncStatusEnum;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SyncHistoryController extends Controller
{
    /**
     * Display the sync history for a UCM server.
     */
    public function index(Ucm $ucm): Response
    {
        $syncHistory = $ucm->syncHistory()
            ->with('syncable')
            ->orderBy('sync_start_time', 'desc')
            ->paginate(20);

        return Inertia::render('Ucm/SyncHistory', [
            'ucm' => $ucm,
            'syncHistory' => $syncHistory,
        ]);
    }

    /**
     * Start a sync operation for a UCM server.
     */
    public function startSync(Ucm $ucm)
    {
        // Check if there's already a sync in progress
        $activeSync = $ucm->syncHistory()
            ->where('status', SyncStatusEnum::SYNCING)
            ->first();

        if ($activeSync) {
            return redirect()->back()
                ->with('toast', [
                    'type' => 'warning',
                    'title' => 'Sync Already in Progress',
                    'message' => 'A sync operation is already running for ' . $ucm->name
                ]);
        }

        // Create a new sync history entry
        $syncHistory = $ucm->syncHistory()->create([
            'sync_start_time' => now(),
            'status' => SyncStatusEnum::SYNCING,
        ]);

        // Dispatch the sync job
        dispatch(new SyncUcmJob($ucm, $syncHistory));

        return redirect()->back()
            ->with('toast', [
                'type' => 'success',
                'title' => 'Sync Started',
                'message' => 'Sync operation has been started for ' . $ucm->name
            ]);
    }

    /**
     * Complete a sync operation.
     */
    public function completeSync(SyncHistory $syncHistory)
    {
        $syncHistory->update([
            'sync_end_time' => now(),
            'status' => 'completed',
        ]);

        // Update the UCM's last_sync_at
        $syncHistory->syncable->update([
            'last_sync_at' => now(),
        ]);

        return redirect()->back()
            ->with('toast', [
                'type' => 'success',
                'title' => 'Sync Completed',
                'message' => 'Sync operation completed successfully'
            ]);
    }

    /**
     * Mark a sync operation as failed.
     */
    public function failSync(SyncHistory $syncHistory, Request $request)
    {
        $syncHistory->update([
            'sync_end_time' => now(),
            'status' => 'failed',
            'error' => $request->input('error', 'Unknown error occurred'),
        ]);

        return redirect()->back()
            ->with('toast', [
                'type' => 'error',
                'title' => 'Sync Failed',
                'message' => 'Sync operation failed'
            ]);
    }
}
