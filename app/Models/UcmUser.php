<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;
use MongoDB\Laravel\Relations\BelongsToMany;

class UcmUser extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public function serviceAreas(): BelongsToMany
    {
        return $this->belongsToMany(ServiceArea::class);
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


