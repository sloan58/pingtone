<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class Intercom extends Model
{
    protected $guarded = [];

    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    public static function storeUcmDetails(array $intercom, UcmCluster $ucmCluster): void
    {
        $intercom['ucm_cluster_id'] = $ucmCluster->id;
        self::updateOrCreate(['uuid' => $intercom['uuid']], $intercom)->touch();
    }
}


