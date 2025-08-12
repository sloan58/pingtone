<?php

namespace App\Console\Commands;

use App\Models\Ucm;
use Illuminate\Console\Command;
use App\Jobs\GatherPhoneStatsJob;

class GatherPhoneStatsCommand extends Command
{
    protected $signature = 'phones:gather-stats {ucm_id? : Gather stats from a single UCM by ID; omit to gather from all}';

    protected $description = 'Gather phone statistics (last active, last seen, last UCM settings) from UCM registrationdynamic table';

    public function handle(): int
    {
        $ucmId = $this->argument('ucm_id');

        $query = Ucm::query();
        if ($ucmId) {
            $query->where('_id', $ucmId);
        }

        $ucms = $query->get();
        if ($ucms->isEmpty()) {
            $this->warn('No UCMs found to gather stats from.');
            return self::SUCCESS;
        }

        foreach ($ucms as $ucm) {
            GatherPhoneStatsJob::dispatch($ucm);
            $this->info("Dispatched phone stats gathering for UCM {$ucm->name} ({$ucm->getKey()})");
        }

        return self::SUCCESS;
    }
}
