<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class ServiceAreaDeviceLink extends Model
{
    protected $collection = 'service_area_device_links';
    
    protected $fillable = [
        'service_area_id',
        'device_id',
        'device_type',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the service area that owns this link.
     */
    public function serviceArea(): BelongsTo
    {
        return $this->belongsTo(ServiceArea::class);
    }

    /**
     * Get the device that owns this link.
     * This is a polymorphic relationship based on device_type
     */
    public function device()
    {
        return match($this->device_type) {
            'Phone' => Phone::find($this->device_id),
            'DeviceProfile' => DeviceProfile::find($this->device_id),
            'RemoteDestinationProfile' => RemoteDestinationProfile::find($this->device_id),
            default => null
        };
    }
}
