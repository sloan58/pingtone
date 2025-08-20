<?php

namespace App\Jobs;

use App\Models\UcmCluster;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Throwable;

class InfrastructureSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    private UcmCluster $ucmCluster;

    public function __construct(UcmCluster $ucmCluster) {
        $this->ucmCluster = $ucmCluster;
    }

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        $infraTypes = [
            'presence_groups',
            'sip_dial_rules',
            'phone_security_profiles',
            'geo_locations',
            'user_locales',
            'aar_groups',
            'moh_audio_sources',
            'media_resource_group_lists',
            'recording_profiles',
            'voicemail_profiles',
            'phone_models',
            'softkey_templates',
            'route_partitions',
            'calling_search_spaces',
            'device_pools',
            'external_call_control_profiles',
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

        $jobs = array_map(fn (string $type) => new InfraSyncJob($this->ucmCluster, $type), $infraTypes);

        $cluster = UcmCluster::find($this->ucmCluster->id);

        Bus::batch($jobs)
            ->name("Infra sync: {$this->ucmCluster->name}")
            ->catch(static function (Batch $batch, Throwable $e) use ($cluster)  {
                Log::error("Infra batch failed for {$cluster->name}: {$e->getMessage()}");
                throw $e;
            })
            ->dispatch();
    }
}


