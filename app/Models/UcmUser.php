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

    public static function storeUcmDetails(array $user, Ucm $ucm): void
    {
        $user['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $user['uuid']], $user);
    }
}


