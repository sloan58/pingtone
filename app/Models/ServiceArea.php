<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use App\Jobs\AssignServiceAreasJob;
use MongoDB\Laravel\Relations\BelongsToMany;

class ServiceArea extends Model
{
    protected $guarded = [];

    protected $casts = [
        'userFilters' => 'array',
    ];

    public function ucmUsers(): BelongsToMany
    {
        return $this->belongsToMany(UcmUser::class);
    }

    /**
     * Manually trigger assignment of users to service areas
     */
    public static function triggerUserAssignment(): void
    {
        dispatch(new AssignServiceAreasJob());
    }
}
