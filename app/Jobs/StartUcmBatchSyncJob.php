<?php

namespace App\Jobs;

use Throwable;
use App\Models\Ucm;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class StartUcmBatchSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected string $ucmId) {}

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        $ucm = Ucm::find($this->ucmId);
        if (!$ucm) {
            Log::warning("StartUcmBatchSyncJob: UCM not found: {$this->ucmId}");
            return;
        }

        $infraTypes = [
            'moh_audio_sources',
            'media_resource_group_lists',
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
            'common_device_configs',
            'line_groups',
            'ucm_users',
            'phone_button_templates',
            'ucm_roles',
        ];

        $jobs = array_map(fn (string $type) => new InfraSyncJob($ucm, $type), $infraTypes);

        $ucmId = $ucm->getKey();
        Bus::batch($jobs)
            ->name("Infra sync: {$ucm->name}")
            ->then(static function (Batch $batch) use ($ucmId) {
                $ucm = Ucm::find($ucmId);
                if ($ucm) {
                    ServicesSyncJob::dispatch($ucm);
                }
            })
            ->catch(static function (Batch $batch, Throwable $e) use ($ucmId) {
                $ucm = Ucm::find($ucmId);
                $name = $ucm?->name ?? $ucmId;
                Log::error("Infra batch failed for {$name}: {$e->getMessage()}");
            })
            ->dispatch();
    }
}


