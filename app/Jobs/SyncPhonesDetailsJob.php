<?php

namespace App\Jobs;

use App\Models\Phone;
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

class SyncPhonesDetailsJob implements ShouldQueue
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
                Phone::storeUcmDetails($phoneDetails, $this->ucmCluster);
            } catch (Exception $e) {
                Log::warning("{$this->ucmCluster->name}: get phone failed: {$phone['name']} - {$e->getMessage()}");
            }
        }

        $this->ucmCluster->phones()->where('updated_at', '<', $start)->delete();
    }
}


