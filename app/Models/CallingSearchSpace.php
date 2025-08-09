<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallingSearchSpace extends Model
{
    protected $fillable = [
        'uuid',
        'name',
        'ucm_id',
    ];

    protected $with = ['ucm'];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        // Add ucm_id and pass raw rows to the bulk upsert helper; it will handle chunking and persistence
        $rows = array_map(function ($record) use ($ucm) {
            $doc = is_array($record) ? $record : json_decode(json_encode($record), true);
            $doc['ucm_id'] = $ucm->id;
            return $doc;
        }, $responseData);

        MongoBulkUpsert::upsert(
            'calling_search_spaces',
            $rows,
            ['ucm_id', 'name'],
            null, // full-document upsert
            1000,
            ['name' => 1, 'ucm_id' => 1]
        );
    }
}


