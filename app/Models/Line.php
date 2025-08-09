<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Line extends Model
{
    protected $fillable = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public function phones(): BelongsToMany
    {
        return $this->belongsToMany(Phone::class, 'device_line')
            ->withPivot([
                'index',
                'dirn',
                'display',
                'display_ascii',
                'e164_alt_num',
                'external_phone_number_mask',
                'max_num_calls',
                'busy_trigger',
                'ring_settings',
            ])
            ->withTimestamps();
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'lines',
            $rows,
            ['uuid', 'ucm_id'],
            ['uuid' => 1, 'ucm_id' => 1]
        );
    }
}
