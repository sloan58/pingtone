<?php

namespace App\Console\Commands;

use App\Jobs\GatherPhoneApiDataJob;
use App\Models\Ucm;
use Illuminate\Console\Command;

class GatherPhoneApiDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'phones:gather-api-data 
                            {ucm? : The name of the UCM to gather data for}
                            {--phones= : Comma-separated list of phone names to gather data for}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Gather device information and network configuration from phone APIs';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $ucmName = $this->argument('ucm');
        $phoneNames = $this->option('phones');

        // Parse phone names if provided
        $phones = null;
        if ($phoneNames) {
            $phones = array_map('trim', explode(',', $phoneNames));
        }

        if ($ucmName) {
            // Gather data for specific UCM
            $ucm = Ucm::where('name', $ucmName)->first();
            if (!$ucm) {
                $this->error("UCM '{$ucmName}' not found.");
                return 1;
            }

            $this->info("Gathering phone API data for UCM: {$ucm->name}");
            GatherPhoneApiDataJob::dispatch($ucm, $phones);
        } else {
            // Gather data for all active UCMs
            $ucms = Ucm::where('is_active', true)->get();
            
            if ($ucms->isEmpty()) {
                $this->error("No active UCMs found.");
                return 1;
            }

            $this->info("Gathering phone API data for {$ucms->count()} active UCM(s)");

            foreach ($ucms as $ucm) {
                $this->line("  - {$ucm->name}");
                GatherPhoneApiDataJob::dispatch($ucm, $phones);
            }
        }

        $this->info("Phone API data gathering jobs have been queued successfully.");
        return 0;
    }
}
