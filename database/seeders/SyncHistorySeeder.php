<?php

namespace Database\Seeders;

use App\Models\Ucm;
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
        $ucms = Ucm::all();

        foreach ($ucms as $ucm) {
            // Create some sample sync history entries
            $this->createSyncHistory($ucm, SyncStatusEnum::COMPLETED, now()->subDays(2), now()->subDays(2)->addMinutes(5));
            $this->createSyncHistory($ucm, SyncStatusEnum::COMPLETED, now()->subDays(1), now()->subDays(1)->addMinutes(3));
            
            // For the first UCM, add a currently syncing entry
            if ($ucm->id === 1) {
                $this->createSyncHistory($ucm, SyncStatusEnum::SYNCING, now()->subMinutes(2));
            }
            
            // For the second UCM, add a failed sync
            if ($ucm->id === 2) {
                $this->createSyncHistory($ucm, SyncStatusEnum::FAILED, now()->subHours(6), now()->subHours(6)->addMinutes(1), 'Connection timeout to UCM server');
            }
        }
    }

    private function createSyncHistory($ucm, SyncStatusEnum $status, $startTime, $endTime = null, $error = null): void
    {
        SyncHistory::create([
            'syncable_type' => Ucm::class,
            'syncable_id' => $ucm->id,
            'sync_start_time' => $startTime,
            'sync_end_time' => $endTime,
            'status' => $status,
            'error' => $error,
        ]);
    }
}
