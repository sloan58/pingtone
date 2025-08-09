<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallingSearchSpace extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => $row + ['ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'calling_search_spaces',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
    }
}
