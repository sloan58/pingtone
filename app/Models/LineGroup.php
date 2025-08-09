<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineGroup extends Model
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
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'line_groups',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
    }
}


