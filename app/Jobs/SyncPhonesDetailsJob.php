<?php

namespace App\Jobs;

use App\Models\Phone;
use App\Models\Ucm;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncPhonesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm)
    {
    }

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
        $start = now();

        $phoneList = $axlApi->listUcmObjects(
            'listPhone',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => ''],
            ],
            'phone'
        );

        foreach ($phoneList as $phone) {
            try {
                Phone::storeUcmDetails($axlApi->getPhoneByName($phone['name']), $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get phone failed: {$phone['name']} - {$e->getMessage()}");
            }
        }

        $this->ucm->phones()->where('updated_at', '<', $start)->delete();
    }
}


