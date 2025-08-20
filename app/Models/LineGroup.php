<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class LineGroup extends Model
{
    protected $guarded = [];

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    public static function storeUcmDetails(array $lineGroup, UcmCluster $ucmCluster): void
    {
        $lineGroup['ucm_cluster_id'] = $ucmCluster->id;
        self::updateOrCreate(['uuid' => $lineGroup['uuid']], $lineGroup)->touch();
    }
}


