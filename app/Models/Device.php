<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

abstract class Device extends Model
{
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
        static::addGlobalScope('device_class', function ($query) {
            $query->where('class', static::getDeviceClass());
        });
    }

    /**
     * Get the device class for this model
     */
    abstract protected static function getDeviceClass(): string;

    /**
     * Get the UCM that owns this device.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }
}
