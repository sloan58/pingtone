<?php

namespace App\Models;

use MongoDB\Laravel\Relations\BelongsTo;

class RemoteDestinationProfile extends Device
{
    /**
     * Get the device class for this model
     */
    protected static function getDeviceClass(): string
    {
        return 'Remote Destination Profile';
    }

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }



    public static function storeUcmDetails(array $profile, UcmCluster $ucmCluster): void
    {
        $profile['ucm_cluster_id'] = $ucmCluster->id;
        self::updateOrCreate(['uuid' => $profile['uuid']], $profile)->touch();
    }
}


