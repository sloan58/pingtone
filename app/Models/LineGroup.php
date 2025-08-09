<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineGroup extends Model
{
    protected $guarded = [];

    protected $with = ['ucm'];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmDetails(array $lineGroup, Ucm $ucm): void
    {
        $lineGroup['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $lineGroup['uuid']], $lineGroup);
    }
}


