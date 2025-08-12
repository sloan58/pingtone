<?php

namespace App\Models;

use Log;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    /**
     * Update phone lastx statistics using bulk operations
     */
    public static function updateLastXStats(array $stats, Ucm $ucm): void
    {
        $operations = [];
        foreach ($stats as $stat) {
            $operations[] = [
                'updateOne' => [
                    [
                        'uuid' => "{{$stat['uuid']}}",
                        'ucm_id' => $ucm->id
                    ],
                    [
                        '$set' => ['lastx' => $stat]
                    ]
                ]
            ];
        }

        $result = self::raw()->bulkWrite($operations);

        Log::info("Bulk updated phone stats", [
            'ucm_id' => $ucm->id,
            'matched_count' => $result->getMatchedCount(),
            'modified_count' => $result->getModifiedCount(),
            'stats_count' => count($stats)
        ]);
    }
}
