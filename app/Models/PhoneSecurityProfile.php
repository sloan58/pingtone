<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class PhoneSecurityProfile extends Model
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
        foreach ($responseData as $profile) {
            $profile['ucm_cluster_id'] = $ucmCluster->id;
            $model = self::updateOrCreate(
                ['uuid' => $profile['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
                $profile
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $profile, UcmCluster $ucmCluster): void
    {
        $profile['ucm_cluster_id'] = $ucmCluster->id;
        $model = self::updateOrCreate(
            ['uuid' => $profile['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
            $profile
        );
        $model->touch();
    }
}
