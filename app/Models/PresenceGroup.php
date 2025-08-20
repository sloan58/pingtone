<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class PresenceGroup extends Model
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
        foreach ($responseData as $presenceGroup) {
            $presenceGroup['ucm_cluster_id'] = $ucmCluster->id;
            $model = self::updateOrCreate(
                ['uuid' => $presenceGroup['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
                $presenceGroup
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $presenceGroup, UcmCluster $ucmCluster): void
    {
        $presenceGroup['ucm_cluster_id'] = $ucmCluster->id;
        $model = self::updateOrCreate(
            ['uuid' => $presenceGroup['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
            $presenceGroup
        );
        $model->touch();
    }
}
