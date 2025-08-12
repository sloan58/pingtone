<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ucm;
use App\Models\PerfMonCounter;
use App\Models\PerfMonHost;
use App\Jobs\CollectPerfMonMetricsJob;

class CollectPerfMonMetrics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'perfmon:collect 
                            {--ucm= : UCM ID to collect from}
                            {--all : Collect from all active UCMs}
                            {--sync : Run synchronously instead of queueing}
                            {--init : Initialize default counters and primary host}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Collect PerfMon metrics from UCM servers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Handle initialization
        if ($this->option('init')) {
            return $this->initializePerfMon();
        }

        // Determine which UCMs to collect from
        $ucms = $this->getTargetUcms();

        if ($ucms->isEmpty()) {
            $this->error('No UCMs found for collection');
            return 1;
        }

        $this->info("Starting PerfMon collection for {$ucms->count()} UCM(s)");

        foreach ($ucms as $ucm) {
            $this->info("Processing UCM: {$ucm->name} ({$ucm->ipAddress})");

            // Get enabled hosts for this UCM
            $hosts = PerfMonHost::forUcm($ucm->id)
                ->enabled()
                ->get();

            if ($hosts->isEmpty()) {
                $this->warn("No enabled hosts found for UCM {$ucm->name}");
                
                // Try to create a default host if none exists
                if (PerfMonHost::forUcm($ucm->id)->count() === 0) {
                    $this->info("Creating default host for UCM {$ucm->name}");
                    $host = PerfMonHost::create([
                        'ucm_id' => $ucm->id,
                        'hostname' => $ucm->ipAddress,
                        'ip_address' => $ucm->ipAddress,
                        'node_type' => 'publisher',
                        'status' => 'unknown',
                        'collection_enabled' => true
                    ]);
                    $hosts = collect([$host]);
                }
            }

            foreach ($hosts as $host) {
                $this->info("  Collecting from host: {$host->hostname}");

                if ($this->option('sync')) {
                    // Run synchronously
                    $job = new CollectPerfMonMetricsJob($ucm, $host);
                    $job->handle();
                    $this->info("  ✓ Collection completed for {$host->hostname}");
                } else {
                    // Queue the job
                    CollectPerfMonMetricsJob::dispatch($ucm, $host);
                    $this->info("  ✓ Collection job queued for {$host->hostname}");
                }
            }
        }

        $this->info('PerfMon collection initiated successfully');
        return 0;
    }

    /**
     * Get target UCMs based on command options
     */
    protected function getTargetUcms()
    {
        if ($this->option('all')) {
            return Ucm::where('active', true)->get();
        }

        if ($ucmId = $this->option('ucm')) {
            $ucm = Ucm::find($ucmId);
            return $ucm ? collect([$ucm]) : collect();
        }

        // Default to first active UCM
        $ucm = Ucm::where('active', true)->first();
        return $ucm ? collect([$ucm]) : collect();
    }

    /**
     * Initialize PerfMon with default counters and host
     */
    protected function initializePerfMon()
    {
        $ucmId = $this->option('ucm');
        
        if (!$ucmId) {
            $this->error('Please specify a UCM ID with --ucm=ID');
            return 1;
        }

        $ucm = Ucm::find($ucmId);
        if (!$ucm) {
            $this->error("UCM with ID {$ucmId} not found");
            return 1;
        }

        $this->info("Initializing PerfMon for UCM: {$ucm->name}");

        // Create default host if not exists
        $host = PerfMonHost::firstOrCreate(
            [
                'ucm_id' => $ucm->id,
                'hostname' => $ucm->ipAddress
            ],
            [
                'ip_address' => $ucm->ipAddress,
                'node_type' => 'publisher',
                'status' => 'unknown',
                'collection_enabled' => true
            ]
        );

        $this->info("✓ Host configured: {$host->hostname}");

        // Create default counters
        $defaultCounters = PerfMonCounter::getDefaultCounters($ucm->id);
        $created = 0;
        $skipped = 0;

        foreach ($defaultCounters as $counterData) {
            $exists = PerfMonCounter::where('ucm_id', $ucm->id)
                ->where('object', $counterData['object'])
                ->where('counter', $counterData['counter'])
                ->exists();

            if (!$exists) {
                PerfMonCounter::create($counterData);
                $created++;
                $this->info("  ✓ Created counter: {$counterData['name']}");
            } else {
                $skipped++;
            }
        }

        $this->info("Initialization complete!");
        $this->info("  - Host: {$host->hostname}");
        $this->info("  - Counters created: {$created}");
        $this->info("  - Counters skipped: {$skipped}");
        $this->info("");
        $this->info("You can now run 'php artisan perfmon:collect --ucm={$ucm->id}' to start collecting metrics");

        return 0;
    }
}
