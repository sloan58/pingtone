<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class UcmUser extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get service areas relationship (Laravel expects this to return a Relation)
     */
    public function serviceAreas(): \MongoDB\Laravel\Relations\BelongsToMany
    {
        // Return a dummy belongsToMany relationship for Laravel compatibility
        return $this->belongsToMany(ServiceArea::class, null, 'ucm_user_id', 'service_area_id');
    }

    /**
     * Get service areas using custom link table query
     * Use this method for actual data retrieval
     */
    public function getServiceAreas()
    {
        $serviceAreaIds = \App\Models\ServiceAreaUcmUserLink::where('ucm_user_id', $this->id)
            ->pluck('service_area_id');
            
        return \App\Models\ServiceArea::whereIn('id', $serviceAreaIds);
    }

    public function scopeEndUsers($query)
    {
        return $query->where('type', 'enduser');
    }

    public function scopeAppUsers($query)
    {
        return $query->where('type', 'appuser');
    }

    public static function storeUcmDetails(array $user, Ucm $ucm, string $type = 'enduser'): void
    {
        $user['ucm_id'] = $ucm->id;
        $user['type'] = $type;
        self::updateOrCreate(['uuid' => $user['uuid']], $user)->touch();
    }
}


