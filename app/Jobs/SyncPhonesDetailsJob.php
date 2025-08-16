<?php

namespace App\Jobs;

use SoapFault;
use Exception;
use App\Models\Ucm;
use App\Models\Phone;
use Illuminate\Bus\Queueable;
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class SyncPhonesDetailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(protected Ucm $ucm)
    {
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
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

        $phonesLastStatuses = $axlApi->performSqlQuery(
            'SELECT UPPER(fkdevice) as uuid, lastactive, lastseen, lastknownucm FROM registrationdynamic'
        );

        foreach ($phoneList as $phone) {
            try {
                $phoneDetails = $axlApi->getPhoneByName($phone['name']);
                $lastStatuses = array_find(
                    $phonesLastStatuses,
                    fn($item) => "{{$item['uuid']}}" == $phone['uuid']
                );
                if($lastStatuses) {
                    $phoneDetails = $phoneDetails + $lastStatuses;
                }
                Phone::storeUcmDetails($phoneDetails, $this->ucm);
            } catch (Exception $e) {
                Log::warning("{$this->ucm->name}: get phone failed: {$phone['name']} - {$e->getMessage()}");
            }
        }

        $this->ucm->phones()->where('updated_at', '<', $start)->delete();
    }
}


