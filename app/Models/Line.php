<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Line extends Model
{
    protected $guarded = [];

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return '_id';
    }
    
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public function phones(): BelongsToMany
    {
        return $this->belongsToMany(Phone::class, 'device_line')
            ->withPivot([
                'index',
                'dirn',
                'display',
                'display_ascii',
                'e164_alt_num',
                'external_phone_number_mask',
                'max_num_calls',
                'busy_trigger',
                'ring_settings',
            ])
            ->withTimestamps();
    }

    /**
     * Check if this line is shared (used by 2 or more devices)
     */
    public function getIsSharedAttribute(): bool
    {
        // Count devices that have this line in their lines.line array
        $deviceCount = Phone::raw()->countDocuments([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ]);

        return $deviceCount >= 2;
    }

    /**
     * Get the count of devices using this line
     */
    public function getDeviceCountAttribute(): int
    {
        return Phone::raw()->countDocuments([
            'lines.line' => [
                '$elemMatch' => [
                    'dirn.uuid' => $this->uuid
                ]
            ]
        ]);
    }

    public static function storeUcmDetails(array $line, Ucm $ucm): void
    {
        $line['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $line['uuid']], $line)->touch();
    }
}
