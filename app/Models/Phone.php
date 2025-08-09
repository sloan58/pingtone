<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Phone extends Model
{
    protected $guarded = [];

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

    public function vendorConfig()
    {
        return $this->hasOne(PhoneVendorConfig::class, 'phone_uuid', 'uuid');
    }

    public static function storeUcmDetails(array $phone, Ucm $ucm): void
    {
        $phone['ucm_id'] = $ucm->id;
        self::updateOrCreate(['uuid' => $phone['uuid']], $phone);
    }
}
