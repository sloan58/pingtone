<?php

namespace App\Jobs;

use Exception;
use App\Models\Ucm;
use App\Models\Intercom;
use Illuminate\Bus\Queueable;
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncIntercomsDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
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
                Intercom::storeUcmDetails($axlApi->getLineByUuid($ic['uuid']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get intercom failed: {$ic['uuid']} - {$e->getMessage()}");
            }
        }

        $this->ucm->intercoms()->where('updated_at', '<', $start)->delete();
    }
}


