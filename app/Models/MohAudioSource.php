<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class MohAudioSource extends Model
{
    protected $guarded = [];

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
            'moh_audio_sources',
            $rows,
            ['ucm_cluster_id', 'name'],
            ['name' => 1, 'ucm_cluster_id' => 1]
        );
    }

    public static function storeUcmDetails(array $audioSource, UcmCluster $ucmCluster): void
    {
        $audioSource['ucm_cluster_id'] = $ucmCluster->id;
        $model = self::updateOrCreate(['uuid' => $audioSource['uuid']], $audioSource);
        $model->touch();
    }
}
