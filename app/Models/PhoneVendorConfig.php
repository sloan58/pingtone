<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneVendorConfig extends Model
{
    protected $fillable = [
        'phone_uuid',
        'ucm_id',
        'xml',
    ];

    protected $with = ['ucm'];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }
}


