<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class AllDevice extends Model
{
    protected $guarded = [];

    /**
     * The table associated with the model.
     */
    protected $table = 'devices';

    /**
     * Get the UCM that owns this device.
     */
    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    /**
     * Scope to filter by device class
     */
    public function scopeOfClass($query, string $deviceClass)
    {
        return $query->where('class', $deviceClass);
    }

    /**
     * Scope to get only phones
     */
    public function scopePhones($query)
    {
        return $query->where('class', 'Phone');
    }

    /**
     * Scope to get only specific device types
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('class', $type);
    }
}
