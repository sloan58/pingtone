<?php

namespace App\Jobs;

use App\Models\Line;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncLinesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
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
                Line::storeUcmDetails($axlApi->getLineByUuid($line['uuid']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get line failed: {$line['uuid']} - {$e->getMessage()}");
            }
        }

        $this->ucm->lines()->where('updated_at', '<', $start)->delete();
    }
}


