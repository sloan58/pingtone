<?php

namespace App\Models;

use DB;
use Exception;
use MongoDB\BSON\UTCDateTime;
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
        // Use standard Laravel upsert with chunking for large payloads
        $nowUtc = new UTCDateTime(now());
        $chunkSize = 1000;

        foreach (array_chunk($responseData, $chunkSize) as $chunk) {
            $rows = [];

            foreach ($chunk as $record) {
                $uuid = is_array($record) ? ($record['uuid'] ?? null) : ($record->uuid ?? null);
                $name = is_array($record) ? ($record['name'] ?? null) : ($record->name ?? null);

                if ($uuid === null || $name === null) {
                    // Skip invalid records but keep processing others
                    continue;
                }

                $rows[] = [
                    'uuid' => $uuid,
                    'name' => $name,
                    'ucm_id' => $ucm->id,
                    'created_at' => $nowUtc,
                    'updated_at' => $nowUtc,
                ];
            }

            if (!empty($rows)) {
                // Upsert on composite key (ucm_id, name)
                // Update columns include uuid and updated_at
                static::query()->upsert(
                    $rows,
                    ['ucm_id', 'name'],
                    ['uuid', 'name', 'updated_at']
                );
            }
        }
    }
}
