<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasMany;

class DataDictionaryTable extends Model
{
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'uniqueness_constraints' => 'array',
        'row_count' => 'integer',
        'size_mb' => 'float',
    ];

    /**
     * Get the fields for this table.
     */
    public function fields(): HasMany
    {
        return $this->hasMany(DataDictionaryField::class, 'table_name', 'name')
            ->where('version', $this->version);
    }

    /**
     * Scope to filter by UCM version.
     */
    public function scopeForVersion($query, string $version)
    {
        return $query->where('version', $version);
    }

    /**
     * Scope to search tables by name or description.
     */
    public function scopeSearchTerm($query, string $searchTerm, bool $useRegex = false)
    {
        if ($useRegex) {
            return $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'))
                  ->orWhere('description', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'));
            });
        }

        return $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'like', "%$searchTerm%")
              ->orWhere('description', 'like', "%$searchTerm%");
        });
    }
}
