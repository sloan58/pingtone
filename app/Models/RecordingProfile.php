<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class RecordingProfile extends Model
{
    protected $guarded = [];

    /**
     * @return BelongsTo
     */
    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    /**
     * Store UCM data from AXL response
     *
     * @param array $responseData
     * @param UcmCluster $ucmCluster
     * @return void
     */
    public static function storeUcmData(array $responseData, UcmCluster $ucmCluster): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_cluster_id' => $ucmCluster->id], $responseData);

        MongoBulkUpsert::upsert(
            'recording_profiles',
            $rows,
            ['ucm_cluster_id', 'name'],
            ['name' => 1, 'ucm_cluster_id' => 1]
        );
    }
}
