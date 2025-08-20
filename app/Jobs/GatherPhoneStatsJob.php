<?php

namespace App\Jobs;

use Exception;
use SoapFault;
use App\Models\Phone;
use App\Services\Axl;
use App\Models\UcmCluster;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class GatherPhoneStatsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected UcmCluster $ucmCluster)
    {
    }

    /**
     * @throws SoapFault
     */
    public function handle(): void
    {
        Log::info("Starting phone stats gathering for UCM {$this->ucmCluster}");

        try {
            $axlClient = new Axl($this->ucmCluster);

            // Execute the registrationdynamic query
            $sql = "SELECT UPPER(fkdevice) as uuid, lastactive, lastseen, lastknownucm FROM registrationdynamic";
            $stats = $axlClient->performSqlQuery($sql);

            if (empty($stats)) {
                return;
            }

            // Store the stats directly in the Phone model's lastx field
            Phone::updateLastXStats($stats, $this->ucmCluster);

            $count = count($stats);
            Log::info("Successfully gathered phone stats for UCM {$this->ucmCluster->name}", [
                'stats_count' => $count,
                'ucm_cluster_id' => $this->ucmCluster->getKey(),
            ]);

        } catch (Exception $e) {
            Log::error("Error gathering phone stats for UCM {$this->ucmCluster->name}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ucm_cluster_id' => $this->ucmCluster->getKey(),
            ]);

            throw $e;
        }
    }

}
