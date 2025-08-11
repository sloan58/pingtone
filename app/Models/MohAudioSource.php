<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MohAudioSource extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'moh_audio_sources',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
    }

    public static function storeUcmDetails(array $audioSource, Ucm $ucm): void
    {
        $audioSource['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(['uuid' => $audioSource['uuid']], $audioSource);
        $model->touch();
    }
}
