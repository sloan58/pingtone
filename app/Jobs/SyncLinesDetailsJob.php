<?php

namespace App\Jobs;

use App\Models\Line;
use App\Models\UcmCluster;
use Exception;
use Illuminate\Bus\Batchable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use SoapFault;

class SyncLinesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected UcmCluster $ucmCluster)
    {
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
    public function handle(): void
    {
        $axlApi = $this->ucmCluster->axlApi();
        $start = now();

        $lines = $axlApi->listUcmObjects(
            'listLine',
            [
                'searchCriteria' => [
                    'pattern' => '%',
                    'usage' => 'Device',
                ],
                'returnedTags' => ['uuid' => ''],
            ],
            'line'
        );

        foreach ($lines as $line) {
            try {
                Line::storeUcmDetails($axlApi->getLineByUuid($line['uuid']), $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get line failed: {$line['uuid']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->lines()->where('updated_at', '<', $start)->delete();
    }
}


