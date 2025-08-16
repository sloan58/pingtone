<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class ServiceAreaPhoneLink extends Model
{
    protected $collection = 'service_area_phone_links';
    
    protected $fillable = [
        'service_area_id',
        'phone_id',
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
     * Get the phone that owns this link.
     */
    public function phone(): BelongsTo
    {
        return $this->belongsTo(Phone::class);
    }
}
