<?php

namespace App\Jobs;

use App\Models\Intercom;
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

class SyncIntercomsDetailsJob implements ShouldQueue
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

        $intercoms = $axlApi->listUcmObjects(
            'listLine',
            [
                'searchCriteria' => [
                    'pattern' => '%',
                    'usage' => 'Device Intercom',
                ],
                'returnedTags' => ['uuid' => ''],
            ],
            'line'
        );

        foreach ($intercoms as $ic) {
            try {
                Intercom::storeUcmDetails($axlApi->getLineByUuid($ic['uuid']), $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get intercom failed: {$ic['uuid']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->intercoms()->where('updated_at', '<', $start)->delete();
    }
}


