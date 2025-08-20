<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;
use MongoDB\Laravel\Relations\BelongsToMany;

class UcmUser extends Model
{
    protected $guarded = [];

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    /**
     * Get service areas relationship (Laravel expects this to return a Relation)
     */
    public function serviceAreas(): BelongsToMany
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
        $serviceAreaIds = ServiceAreaUcmUserLink::where('ucm_user_id', $this->id)
            ->pluck('service_area_id');

        return ServiceArea::whereIn('id', $serviceAreaIds);
    }

    public function scopeEndUsers($query)
    {
        return $query->where('type', 'enduser');
    }

    public function scopeAppUsers($query)
    {
        return $query->where('type', 'appuser');
    }

    public static function storeUcmDetails(array $user, UcmCluster $ucmCluster, string $type = 'enduser'): void
    {
        $user['ucm_cluster_id'] = $ucmCluster->id;
        $user['type'] = $type;
        self::updateOrCreate(['uuid' => $user['uuid']], $user)->touch();
    }
}


