<?php

namespace App\Models;

use App\Models\Traits\HasDeviceClassScope;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

abstract class Device extends Model
{
    use HasDeviceClassScope;

    protected $guarded = [];

    /**
     * The table associated with the model.
     */
    protected $table = 'devices';

    /**
     * Boot the model and add the global scope for device class
     */
    protected static function boot()
    {
        parent::boot();

        // Add global scope to filter by device class
        static::addDeviceClassScope();
    }

    /**
     * Get the UCM that owns this device.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get all devices without the global scope filter
     * This allows querying the devices table without the class filter
     */
    public static function allDevices()
    {
        return static::withoutGlobalScope('device_class');
    }

    /**
     * Get devices of a specific class without using the global scope
     */
    public static function ofClass(string $deviceClass)
    {
        return static::withoutGlobalScope('device_class')->where('class', $deviceClass);
    }
}
