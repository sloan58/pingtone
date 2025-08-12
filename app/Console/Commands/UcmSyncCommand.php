<?php

namespace App\Console\Commands;

use App\Models\Ucm;
use Illuminate\Console\Command;
use App\Jobs\StartUcmBatchSyncJob;

class UcmSyncCommand extends Command
{
    protected $signature = 'ucm:sync {ucm_id? : Sync a single UCM by ID; omit to sync all}';

    protected $description = 'Run UCM sync in two phases: infra (parallel) then services (list+get fan-out).';

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
            StartUcmBatchSyncJob::dispatch($ucm->getKey());
            $this->info("Queued batch sync starter for UCM {$ucm->name} ({$ucm->getKey()}).");
        }

        return self::SUCCESS;
    }
}


