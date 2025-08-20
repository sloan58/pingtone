<?php

namespace Database\Seeders;

use App\Models\UcmNode;
use App\Models\UcmCluster;
use App\Models\SyncHistory;
use App\Enums\SyncStatusEnum;
use Illuminate\Database\Seeder;

class SyncHistorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $clusters = UcmCluster::all();

        foreach ($clusters as $cluster) {
            // Create some sample sync history entries for clusters
            $this->createSyncHistory($cluster, SyncStatusEnum::COMPLETED, now()->subDays(2), now()->subDays(2)->addMinutes(5));
            $this->createSyncHistory($cluster, SyncStatusEnum::COMPLETED, now()->subDays(1), now()->subDays(1)->addMinutes(3));

            // For the first cluster, add a currently syncing entry
            if ($cluster->id === 1) {
                $this->createSyncHistory($cluster, SyncStatusEnum::SYNCING, now()->subMinutes(2));
            }

            // For additional clusters, add a failed sync
            if ($cluster->id > 1) {
                $this->createSyncHistory($cluster, SyncStatusEnum::FAILED, now()->subHours(6), now()->subHours(6)->addMinutes(1), 'Connection timeout to UCM cluster');
            }
        }
    }

    private function createSyncHistory($cluster, SyncStatusEnum $status, $startTime, $endTime = null, $error = null): void
    {
        SyncHistory::create([
            'syncable_type' => UcmCluster::class,
            'syncable_id' => $cluster->id,
            'sync_start_time' => $startTime,
            'sync_end_time' => $endTime,
            'status' => $status,
            'error' => $error,
        ]);
    }
}
