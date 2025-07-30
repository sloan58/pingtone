<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneModel extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'maxExpansionModules',
        'supportedExpansionModules',
        'ucm_id',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'supportedExpansionModules' => 'array',
    ];

    /**
     * The relationships that should always be loaded.
     */
    protected $with = ['ucm'];

    /**
     * Get the UCM that owns this phone model.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }
} 