<?php

namespace App\Jobs;

use SoapFault;
use Exception;
use App\Models\Phone;
use App\Services\Axl;
use App\Models\UcmNode;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class GatherPhoneStatsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected UcmNode $ucm
    )
    {
    }

    /**
     * @throws SoapFault
     */
    public function handle(): void
    {
        Log::info("Starting phone stats gathering for UCM {$this->ucm->name}");

        try {
            $axlClient = new Axl($this->ucm);

            // Execute the registrationdynamic query
            $sql = "SELECT UPPER(fkdevice) as uuid, lastactive, lastseen, lastknownucm FROM registrationdynamic";
            $stats = $axlClient->performSqlQuery($sql);

            if (empty($stats)) {
                return;
            }

            // Store the stats directly in the Phone model's lastx field
            Phone::updateLastXStats($stats, $this->ucm);

            $count = count($stats);
            Log::info("Successfully gathered phone stats for UCM {$this->ucm->name}", [
                'stats_count' => $count,
                'ucm_cluster_id' => $this->ucm->getKey(),
            ]);

        } catch (Exception $e) {
            Log::error("Error gathering phone stats for UCM {$this->ucm->name}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ucm_cluster_id' => $this->ucm->getKey(),
            ]);

            throw $e;
        }
    }

}
