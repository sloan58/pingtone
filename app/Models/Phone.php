<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Phone extends Model
{
    protected $fillable = [];

    protected $casts = [
        'expansion_modules' => 'array',
        'vendor_config' => 'array',
        'enable_extension_mobility' => 'boolean',
    ];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public function lines(): BelongsToMany
    {
        return $this->belongsToMany(Line::class, 'device_line')
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

    public static function storeUcmList(array $responseData, Ucm $ucm): array
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'phones',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );

        return array_column($responseData, 'name');
    }

    public static function storeUcmDetails(array $phones, Ucm $ucm): void
    {
        // Upsert full RPhone docs by uuid+ucm_id (assumes getPhone responses)
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $phones);

        MongoBulkUpsert::upsert(
            'phones',
            $rows,
            ['uuid', 'ucm_id'],
            ['uuid' => 1, 'ucm_id' => 1]
        );
    }
}
