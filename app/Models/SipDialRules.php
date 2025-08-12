<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SipDialRules extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $data, Ucm $ucm): void
    {
        foreach ($data as $sipDialRules) {
            // Map dialPlanName to name for consistency
            if (isset($sipDialRules['dialPlanName'])) {
                $sipDialRules['name'] = $sipDialRules['dialPlanName'];
            }
            $sipDialRules['ucm_id'] = $ucm->id;
            $model = self::updateOrCreate(
                ['uuid' => $sipDialRules['uuid'], 'ucm_id' => $ucm->id],
                $sipDialRules
            );
            $model->touch();
        }
    }

    public static function storeUcmDetails(array $sipDialRules, Ucm $ucm): void
    {
        // Map dialPlanName to name for consistency
        if (isset($sipDialRules['dialPlanName'])) {
            $sipDialRules['name'] = $sipDialRules['dialPlanName'];
        }
        $sipDialRules['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(
            ['uuid' => $sipDialRules['uuid'], 'ucm_id' => $ucm->id],
            $sipDialRules
        );
        $model->touch();
    }
}
