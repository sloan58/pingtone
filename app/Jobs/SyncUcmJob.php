<?php

namespace App\Jobs;

use App\Enums\SyncStatusEnum;
use App\Models\SyncHistory;
use App\Models\UcmCluster;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncUcmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected UcmCluster  $cluster,
        protected SyncHistory $syncHistory
    )
    {
    }

    /**
     * @throws Throwable
     */
    public function handle(): void
    {
        // $this can't be used inside the Laravel Bus callbacks
        $cluster = UcmCluster::find($this->cluster->id);
        $syncHistory = SyncHistory::find($this->syncHistory->id);

        Bus::chain([
            new InfrastructureSyncJob($this->cluster),
            new ServicesSyncJob($this->cluster),
            new AssignUcmUsersToServiceAreasJob,
            new AssignDevicesToServiceAreasJob,
            function () use ($syncHistory, $cluster) {
                $syncHistory->update([
                    'sync_end_time' => now(),
                    'status' => SyncStatusEnum::COMPLETED,
                ]);

                $cluster->update([
                    'last_sync_at' => now(),
                ]);
                Log::info("SyncUcmJob completed successfully for {$cluster->name}");
            }
        ])->catch(static function (Throwable $e) use ($cluster, $syncHistory) {
            $syncHistory->update([
                'sync_end_time' => now(),
                'status' => SyncStatusEnum::FAILED,
                'error' => $e->getMessage(),
            ]);
            Log::error("SyncUcmJob failed for {$cluster->name}: {$e->getMessage()}");
            throw $e;
        })->dispatch();
    }
}
