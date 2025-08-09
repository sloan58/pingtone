<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RemoteDestination extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmDetails(array $rd, Ucm $ucm): void
    {
        $rd['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $rd['uuid']], $rd)->touch();
    }
}


