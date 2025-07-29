<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ucm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'hostname',
        'username',
        'password',
        'version',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function phones(): HasMany
    {
        return $this->hasMany(Phone::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(Line::class);
    }
} 