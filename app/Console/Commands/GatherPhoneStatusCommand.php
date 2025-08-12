<?php

namespace App\Console\Commands;

use App\Models\Ucm;
use App\Jobs\GatherPhoneStatusJob;
use Illuminate\Console\Command;

class GatherPhoneStatusCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ucm:gather-phone-status 
                            {ucm? : The UCM name or ID to gather status for}
                            {--phones=* : Specific phone names to query (optional)}
                            {--all : Gather status for all UCMs}
                            {--queue : Dispatch to queue instead of running synchronously}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gather phone status information from RisPort API';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $ucmIdentifier = $this->argument('ucm');
        $specificPhones = $this->option('phones');
        $allUcms = $this->option('all');
        $useQueue = $this->option('queue');

        if ($allUcms) {
            return $this->gatherForAllUcms($specificPhones, $useQueue);
        }

        if (!$ucmIdentifier) {
            $this->error('Please specify a UCM name/ID or use --all flag');
            return 1;
        }

        return $this->gatherForSingleUcm($ucmIdentifier, $specificPhones, $useQueue);
    }

    /**
     * Gather phone status for all UCMs
     */
    private function gatherForAllUcms(?array $phones, bool $useQueue): int
    {
        $ucms = Ucm::all();

        if ($ucms->isEmpty()) {
            $this->warn('No UCMs found in the system');
            return 0;
        }

        $this->info("Gathering phone status for {$ucms->count()} UCM(s)");

        foreach ($ucms as $ucm) {
            $this->info("Processing UCM: {$ucm->name}");
            
            if ($useQueue) {
                GatherPhoneStatusJob::dispatch($ucm, $phones);
                $this->line("  → Queued job for UCM: {$ucm->name}");
            } else {
                try {
                    $job = new GatherPhoneStatusJob($ucm, $phones);
                    $job->handle();
                    $this->line("  → Completed for UCM: {$ucm->name}");
                } catch (\Exception $e) {
                    $this->error("  → Failed for UCM {$ucm->name}: {$e->getMessage()}");
                }
            }
        }

        return 0;
    }

    /**
     * Gather phone status for a single UCM
     */
    private function gatherForSingleUcm(string $ucmIdentifier, ?array $phones, bool $useQueue): int
    {
        // Try to find UCM by ID first, then by name
        $ucm = Ucm::find($ucmIdentifier) ?? Ucm::where('name', $ucmIdentifier)->first();

        if (!$ucm) {
            $this->error("UCM not found: {$ucmIdentifier}");
            return 1;
        }

        $this->info("Gathering phone status for UCM: {$ucm->name}");
        
        if (!empty($phones)) {
            $this->line("  → Querying specific phones: " . implode(', ', $phones));
        }

        if ($useQueue) {
            GatherPhoneStatusJob::dispatch($ucm, $phones);
            $this->info("  → Job queued successfully");
        } else {
            try {
                $job = new GatherPhoneStatusJob($ucm, $phones);
                $job->handle();
                $this->info("  → Phone status gathering completed successfully");
            } catch (\Exception $e) {
                $this->error("  → Failed: {$e->getMessage()}");
                return 1;
            }
        }

        return 0;
    }
}
