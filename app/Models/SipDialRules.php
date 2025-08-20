<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class SipDialRules extends Model
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
        foreach ($responseData as $sipDialRules) {
            // Map dialPlanName to name for consistency
            if (isset($sipDialRules['dialPlanName'])) {
                $sipDialRules['name'] = $sipDialRules['dialPlanName'];
            }
            $sipDialRules['ucm_cluster_id'] = $ucmCluster->id;
            $model = self::updateOrCreate(
                ['uuid' => $sipDialRules['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
                $sipDialRules
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $sipDialRules, UcmCluster $ucmCluster): void
    {
        // Map dialPlanName to name for consistency
        if (isset($sipDialRules['dialPlanName'])) {
            $sipDialRules['name'] = $sipDialRules['dialPlanName'];
        }
        $sipDialRules['ucm_cluster_id'] = $ucmCluster->id;
        $model = self::updateOrCreate(
            ['uuid' => $sipDialRules['uuid'], 'ucm_cluster_id' => $ucmCluster->id],
            $sipDialRules
        );
        $model->touch();
    }
}
