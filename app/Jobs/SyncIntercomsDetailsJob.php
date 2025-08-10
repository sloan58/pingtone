<?php

namespace App\Jobs;

use App\Models\Intercom;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncIntercomsDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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


