<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoutePartition extends Model
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
        foreach (array_chunk($responseData, 1000) as $chunk) {
            $rows = array_map(fn($record) => [
                'uuid' => $record->uuid ?? null,
                'name' => $record->name ?? null,
                'ucm_id' => $ucm->id,
            ], $chunk);

            MongoBulkUpsert::upsert(
                'route_partitions',
                $rows,
                ['ucm_id', 'name'],
                ['uuid', 'name', 'ucm_id'],
                1000,
                ['name' => 1, 'ucm_id' => 1]
            );
        }
    }
}


