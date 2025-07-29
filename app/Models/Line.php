<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Line extends Model
{
    use HasFactory;

    protected $fillable = [
        'pkid',
        'pattern',
        'description',
        'route_partition_name',
        'calling_search_space_name',
        'call_pickup_group_name',
        'auto_answer',
        'secondary_calling_search_space_name',
        'recording_media_source',
        'ucm_id',
    ];

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
} 