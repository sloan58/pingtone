<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceProfile extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmDetails(array $profile, Ucm $ucm): void
    {
        $profile['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $profile['uuid']], $profile)->touch();
    }
}


