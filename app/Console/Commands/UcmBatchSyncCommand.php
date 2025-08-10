<?php

namespace App\Console\Commands;

use App\Jobs\InfraSyncJob;
use App\Jobs\WaitForBatchAndDispatchServicesJob;
use App\Models\Ucm;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Bus;

class UcmBatchSyncCommand extends Command
{
    protected $signature = 'ucm:sync-batch {ucm_id? : Sync a single UCM by ID; omit to sync all}';

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

        $infraTypes = [
            'recording_profiles',
            'voicemail_profiles',
            'phone_models',
            'softkey_templates',
            'route_partitions',
            'calling_search_spaces',
            'device_pools',
            'service_profiles',
            'sip_profiles',
            'locations',
            'call_pickup_groups',
            'common_phone_configs',
            'line_groups',
            'ucm_users',
            'phone_button_templates',
            'ucm_roles',
        ];

        foreach ($ucms as $ucm) {
            $jobs = array_map(fn (string $type) => new InfraSyncJob($ucm, $type), $infraTypes);

            $batch = Bus::batch($jobs)
                ->name("Infra sync: {$ucm->name}")
                ->dispatch();

            WaitForBatchAndDispatchServicesJob::dispatch($batch->id, $ucm->getKey());

            $this->info("Dispatched infra batch for UCM {$ucm->name} ({$ucm->getKey()}); services will start after infra completes.");
        }

        return self::SUCCESS;
    }
}


 