<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresenceGroup extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $data, Ucm $ucm): void
    {
        foreach ($data as $presenceGroup) {
            $presenceGroup['ucm_id'] = $ucm->id;
            $model = self::updateOrCreate(
                ['uuid' => $presenceGroup['uuid'], 'ucm_id' => $ucm->id],
                $presenceGroup
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $presenceGroup, Ucm $ucm): void
    {
        $presenceGroup['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(
            ['uuid' => $presenceGroup['uuid'], 'ucm_id' => $ucm->id],
            $presenceGroup
        );
        $model->touch();
    }
}
