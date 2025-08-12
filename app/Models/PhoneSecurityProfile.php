<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneSecurityProfile extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $data, Ucm $ucm): void
    {
        foreach ($data as $profile) {
            $profile['ucm_id'] = $ucm->id;
            $model = self::updateOrCreate(
                ['uuid' => $profile['uuid'], 'ucm_id' => $ucm->id],
                $profile
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $profile, Ucm $ucm): void
    {
        $profile['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(
            ['uuid' => $profile['uuid'], 'ucm_id' => $ucm->id],
            $profile
        );
        $model->touch();
    }
}
