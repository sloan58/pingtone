<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class RemoteDestination extends Model
{
    protected $guarded = [];

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    public static function storeUcmDetails(array $rd, UcmCluster $ucmCluster): void
    {
        $rd['ucm_cluster_id'] = $ucmCluster->id;
        self::updateOrCreate(['uuid' => $rd['uuid']], $rd)->touch();
    }
}


