<?php

namespace App\Console\Commands;

use App\Models\Ucm;
use App\Models\SyncHistory;
use App\Jobs\SyncUcmJob;
use Illuminate\Console\Command;

class SyncUcmCommand extends Command
{
    protected $signature = 'ucm:sync {ucm_id? : Sync a single UCM by ID; omit to sync all}';

    protected $description = 'Trigger UCM syncs using AXL for recording profiles, voicemail profiles, phone models, and users';

    public function handle(): int
    {
        $ucmId = $this->argument('ucm_id');

        $query = Ucm::query();
        if ($ucmId) {
            $query->where('_id', $ucmId);
        }

        $ucms = $query->get();
        if ($ucms->isEmpty()) {
            $this->warn('No UCMs found to sync.');
            return self::SUCCESS;
        }

        foreach ($ucms as $ucm) {
            $syncHistory = SyncHistory::create([
                'syncable_type' => Ucm::class,
                'syncable_id' => $ucm->getKey(),
                'sync_start_time' => now(),
                'status' => \App\Enums\SyncStatusEnum::SYNCING,
            ]);

            SyncUcmJob::dispatch($ucm, $syncHistory);
            $this->info("Dispatched sync for UCM {$ucm->name} ({$ucm->getKey()})");
        }

        return self::SUCCESS;
    }
}


