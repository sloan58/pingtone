<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Phone extends Model
{
    use HasFactory;

    protected $fillable = [
        'pkid',
        'name',
        'description',
        'model',
        'protocol',
        'location_name',
        'calling_search_space_name',
        'subscribe_calling_search_space_name',
        'device_pool_name',
        'sip_profile_name',
        'phone_template_name',
        'softkey_template_name',
        'common_phone_config_name',
        'expansion_modules',
        'hlog',
        'dnd_status',
        'owner_user_name',
        'load_information',
        'vendor_config',
        'enable_extension_mobility',
        'authentication_url',
        'secure_authentication_url',
        'ip_address',
        'status',
        'registered_with',
        'active_load',
        'inactive_load',
        'css_full_text',
        'ucm_id',
    ];

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
} 