<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Support\MongoBulkUpsert;

class RecordingProfile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'uuid',
        'name',
        'ucm_id',
    ];

    /**
     * The relationships that should always be loaded.
     *
     * @var array
     */
    protected $with = ['ucm'];

    /**
     * @return BelongsTo
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
                'ucm_id' => $ucm->id,
            ], $chunk);

            MongoBulkUpsert::upsert(
                'recording_profiles',
                $rows,
                ['ucm_id', 'name'],
                ['uuid', 'name', 'ucm_id'],
                1000,
                ['ucm_id' => 1, 'name' => 1]
            );
        }
    }
}
