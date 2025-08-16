<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class ServiceAreaUcmUserLink extends Model
{
    protected $collection = 'service_area_ucm_user_links';
    
    protected $fillable = [
        'service_area_id',
        'ucm_user_id',
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
     * Get the UCM user that owns this link.
     */
    public function ucmUser(): BelongsTo
    {
        return $this->belongsTo(UcmUser::class);
    }
}
