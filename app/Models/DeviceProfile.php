<?php

namespace App\Models;

use MongoDB\Laravel\Relations\BelongsTo;

class DeviceProfile extends Device
{
    /**
     * Get the device class for this model
     */
    protected static function getDeviceClass(): string
    {
        return 'Device Profile';
    }

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }



    public static function storeUcmDetails(array $profile, Ucm $ucm): void
    {
        $profile['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $profile['uuid']], $profile)->touch();
    }
}


