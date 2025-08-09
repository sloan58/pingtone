<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Intercom extends Model
{
    protected $fillable = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmDetails(array $intercom, Ucm $ucm): void
    {
        $intercom['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $intercom['uuid']], $intercom);
    }
}


