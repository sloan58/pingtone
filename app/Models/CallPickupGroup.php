<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallPickupGroup extends Model
{
    protected $fillable = [
        'uuid',
        'pattern',
        'route_partition_name',
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
            $rows = array_map(function ($record) use ($ucm) {
                $routePartition = null;
                if (isset($record->routePartitionName)) {
                    $rpn = $record->routePartitionName;
                    if (is_object($rpn) && property_exists($rpn, '_')) {
                        $routePartition = $rpn->_; // XFkType text content
                    } else {
                        $routePartition = is_string($rpn) ? $rpn : ($rpn->name ?? null);
                    }
                }

                return [
                    'uuid' => $record->uuid ?? null,
                    'pattern' => $record->pattern ?? null,
                    'route_partition_name' => $routePartition,
                    'ucm_id' => $ucm->id,
                ];
            }, $chunk);

            MongoBulkUpsert::upsert(
                'call_pickup_groups',
                $rows,
                ['ucm_id', 'pattern', 'route_partition_name'],
                ['uuid', 'pattern', 'route_partition_name', 'ucm_id'],
                1000,
                ['pattern' => 1, 'route_partition_name' => 1, 'ucm_id' => 1]
            );
        }
    }
}


