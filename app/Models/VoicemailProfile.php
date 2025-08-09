<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoicemailProfile extends Model
{
    protected $guarded = [];

    /**
     * Get the UCM that owns this voicemail profile.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Store UCM data from AXL response
     *
     * @param array $responseData
     * @param Ucm $ucm
     * @return void
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'voicemail_profiles',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
    }
}
