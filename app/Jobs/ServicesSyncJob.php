<?php

namespace App\Jobs;

use App\Models\Ucm;
use App\Models\Phone;
use App\Models\Intercom;
use App\Models\Line;
use App\Models\DeviceProfile;
use App\Models\RemoteDestination;
use App\Models\RemoteDestinationProfile;
use Illuminate\Bus\Batch;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Log;

class ServicesSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Ucm $ucm) {}

    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();

        // Phones
        $phones = $axlApi->listUcmObjects('listPhone', [
            'searchCriteria' => ['name' => '%'],
            'returnedTags' => ['name' => ''],
        ], 'phone');
        Bus::batch(array_map(function ($p) use ($axlApi) {
            return new class($this->ucm, $p['name']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $name) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    Phone::storeUcmDetails($axl->getPhoneByName($this->name), $this->ucm);
                }
            };
        }, $phones))->dispatch();

        // Device Profiles
        $profiles = $axlApi->listUcmObjects('listDeviceProfile', [
            'searchCriteria' => ['name' => '%'],
            'returnedTags' => ['name' => ''],
        ], 'deviceProfile');
        Bus::batch(array_map(function ($d) use ($axlApi) {
            return new class($this->ucm, $d['name']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $name) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    DeviceProfile::storeUcmDetails($axl->getDeviceProfileByName($this->name), $this->ucm);
                }
            };
        }, $profiles))->dispatch();

        // Remote Destination Profiles
        $rdps = $axlApi->listUcmObjects('listRemoteDestinationProfile', [
            'searchCriteria' => ['name' => '%'],
            'returnedTags' => ['name' => ''],
        ], 'remoteDestinationProfile');
        Bus::batch(array_map(function ($r) use ($axlApi) {
            return new class($this->ucm, $r['name']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $name) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    RemoteDestinationProfile::storeUcmDetails($axl->getRemoteDestinationProfileByName($this->name), $this->ucm);
                }
            };
        }, $rdps))->dispatch();

        // Remote Destinations
        $rds = $axlApi->listUcmObjects('listRemoteDestination', [
            'searchCriteria' => ['destination' => '%'],
            'returnedTags' => ['destination' => ''],
        ], 'remoteDestination');
        Bus::batch(array_map(function ($r) use ($axlApi) {
            return new class($this->ucm, $r['destination']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $destination) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    RemoteDestination::storeUcmDetails($axl->getRemoteDestinationByDestination($this->destination), $this->ucm);
                }
            };
        }, $rds))->dispatch();

        // Lines (Device)
        $lines = $axlApi->listUcmObjects('listLine', [
            'searchCriteria' => ['pattern' => '%', 'usage' => 'Device'],
            'returnedTags' => ['uuid' => ''],
        ], 'line');
        Bus::batch(array_map(function ($l) use ($axlApi) {
            return new class($this->ucm, $l['uuid']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $uuid) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    Line::storeUcmDetails($axl->getLineByUuid($this->uuid), $this->ucm);
                }
            };
        }, $lines))->dispatch();

        // Intercoms
        $intercoms = $axlApi->listUcmObjects('listLine', [
            'searchCriteria' => ['pattern' => '%', 'usage' => 'Device Intercom'],
            'returnedTags' => ['uuid' => ''],
        ], 'line');
        Bus::batch(array_map(function ($i) use ($axlApi) {
            return new class($this->ucm, $i['uuid']) implements ShouldQueue {
                use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
                public function __construct(protected Ucm $ucm, protected string $uuid) {}
                public function handle(): void {
                    $axl = $this->ucm->axlApi();
                    Intercom::storeUcmDetails($axl->getLineByUuid($this->uuid), $this->ucm);
                }
            };
        }, $intercoms))->dispatch();
    }
}


