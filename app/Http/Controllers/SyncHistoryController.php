<?php

namespace App\Http\Controllers;

use App\Enums\SyncStatusEnum;
use App\Jobs\SyncUcmJob;
use App\Models\SyncHistory;
use App\Models\UcmCluster;
use App\Models\UcmNode;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SyncHistoryController extends Controller
{
    /**
     * Display the sync history for a UCM cluster (accessed through a node).
     */
    public function index(UcmNode $ucmNode): Response
    {
        // Get the cluster for this node
        $cluster = $ucmNode->ucmCluster;

        if (!$cluster) {
            // Handle legacy nodes without clusters
            return Inertia::render('Ucm/SyncHistory', [
                'ucm' => $ucmNode,
                'cluster' => null,
                'syncHistory' => collect(),
            ]);
        }

        $syncHistory = $cluster->syncHistory()
            ->with('syncable')
            ->orderBy('sync_start_time', 'desc')
            ->paginate(20);

        return Inertia::render('Ucm/SyncHistory', [
            'ucm' => $ucmNode,
            'cluster' => $cluster,
            'syncHistory' => $syncHistory,
        ]);
    }

    /**
     * Start a sync operation for a UCM cluster (accessed through a node).
     */
    public function startSync(UcmNode $ucmNode)
    {
        // Get the cluster for this node
        $cluster = $ucmNode->ucmCluster;

        if (!$cluster) {
            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Sync Not Available',
                    'message' => 'This UCM node is not part of a cluster. Sync is only available at the cluster level.'
                ]);
        }

        // Check if there's already a sync in progress for the cluster
        $activeSync = $cluster->syncHistory()
            ->where('status', SyncStatusEnum::SYNCING)
            ->first();

        if ($activeSync) {
            return redirect()->back()
                ->with('toast', [
                    'type' => 'warning',
                    'title' => 'Sync Already in Progress',
                    'message' => 'A sync operation is already running for cluster ' . $cluster->name
                ]);
        }

        // Create a new sync history entry for the cluster
        $syncHistory = $cluster->syncHistory()->create([
            'sync_start_time' => now(),
            'status' => SyncStatusEnum::SYNCING,
        ]);

        // Dispatch the sync job with the cluster
        dispatch(new SyncUcmJob($cluster, $syncHistory));

        return redirect()->back()
            ->with('toast', [
                'type' => 'success',
                'title' => 'Sync Started',
                'message' => 'Sync operation has been started for cluster ' . $cluster->name
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



    /**
     * Start a sync operation for a UCM cluster (direct cluster access).
     */
    public function startClusterSync(UcmCluster $ucmCluster)
    {
        if (!$ucmCluster->publisher) {
            return redirect()->back()
                ->with('toast', [
                    'type' => 'warning',
                    'title' => 'No Publisher Node',
                    'message' => 'The ' . $ucmCluster->name . ' does not have a publisher node.'
                ]);
        }

        // Check if there's already a sync in progress for the cluster
        $activeSync = $ucmCluster->has_active_sync;

        if ($activeSync) {
            return redirect()->back()
                ->with('toast', [
                    'type' => 'warning',
                    'title' => 'Sync Already in Progress',
                    'message' => 'A sync operation is already running for cluster ' . $ucmCluster->name
                ]);
        }

        // Create a new sync history entry for the cluster
        $syncHistory = $ucmCluster->syncHistory()->create([
            'sync_start_time' => now(),
            'status' => SyncStatusEnum::SYNCING,
        ]);

        // Dispatch the sync job with the cluster
        dispatch(new SyncUcmJob($ucmCluster, $syncHistory));

        return redirect()->back()
            ->with('toast', [
                'type' => 'success',
                'title' => 'Sync Started',
                'message' => 'Sync operation has been started for cluster ' . $ucmCluster->name
            ]);
    }
}
