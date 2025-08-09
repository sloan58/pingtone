<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Phone extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmDetails(array $phone, Ucm $ucm): void
    {
        $phone['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(['uuid' => $phone['uuid']], $phone);
        $model->touch();
    }
}
