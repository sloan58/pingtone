<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VoicemailProfile extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'uuid',
        'name',
        'ucm_id',
    ];

    /**
     * The relationships that should always be loaded.
     */
    protected $with = ['ucm'];

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
        foreach (array_chunk($responseData, 1000) as $chunk) {
            $rows = array_map(fn($record) => [
                'uuid' => $record->uuid,
                'name' => $record->name,
                'ucm_id' => $ucm->id
            ], $chunk);

            static::query()->upsert(
                $rows,
                ['ucm_id', 'name'],
                ['uuid', 'name', 'updated_at']
            );
        }
    }
}
