<?php

namespace App\Console\Commands;

use App\Enums\SyncStatusEnum;
use App\Jobs\SyncUcmJob;
use App\Models\UcmCluster;
use Illuminate\Console\Command;

class UcmSyncCommand extends Command
{
    protected $signature = 'ucm:sync {cluster_id? : Sync a single cluster by ID; omit to sync all clusters}';

    protected $description = 'Run UCM cluster sync in two phases: infra (parallel) then services (list+get fan-out).';

    public function handle(): int
    {
        $clusterId = $this->argument('cluster_id');

        $query = UcmCluster::query();
        if ($clusterId) {
            $query->where('id', $clusterId);
        }

        $clusters = $query->get();
        if ($clusters->isEmpty()) {
            $this->warn('No UCM clusters found to sync.');
            return self::SUCCESS;
        }

        foreach ($clusters as $cluster) {
            if ($cluster->has_active_sync) {
                $this->error("Sync already in progress for {$cluster->name}.");
                return self::FAILURE;
            }

            $syncHistory = $cluster->syncHistory()->create([
                'sync_start_time' => now(),
                'status' => SyncStatusEnum::SYNCING,
            ]);

            dispatch(new SyncUcmJob($cluster, $syncHistory));
            $this->info("Queued batch sync starter for cluster {$cluster->name}.");
        }

        return self::SUCCESS;
    }
}


