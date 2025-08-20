<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class DataDictionaryField extends Model
{
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'properties' => 'array',
        'rules' => 'array',
    ];

    /**
     * Get the table this field belongs to.
     */
    public function table(): BelongsTo
    {
        return $this->belongsTo(DataDictionaryTable::class, 'table_name', 'name')
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
     * Scope to filter by table name.
     */
    public function scopeForTable($query, string $tableName)
    {
        return $query->where('table_name', $tableName);
    }

    /**
     * Scope to search fields by name, type, or description.
     */
    public function scopeSearchTerm($query, string $searchTerm, bool $useRegex = false)
    {
        if ($useRegex) {
            return $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'))
                  ->orWhere('data_type', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'))
                  ->orWhere('remarks', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'))
                  ->orWhere('description', 'regex', new \MongoDB\BSON\Regex($searchTerm, 'i'));
            });
        }

        return $query->where(function ($q) use ($searchTerm) {
            $q->where('name', 'like', "%$searchTerm%")
              ->orWhere('data_type', 'like', "%$searchTerm%")
              ->orWhere('remarks', 'like', "%$searchTerm%")
              ->orWhere('description', 'like', "%$searchTerm%");
        });
    }

    /**
     * Check if field is nullable based on properties.
     */
    public function getIsNullableAttribute(): bool
    {
        return !in_array('Not Null', $this->properties ?? []);
    }

    /**
     * Check if field is indexed based on properties.
     */
    public function getIsIndexedAttribute(): bool
    {
        return in_array('Indexed', $this->properties ?? []);
    }

    /**
     * Check if field is unique based on properties.
     */
    public function getIsUniqueAttribute(): bool
    {
        return in_array('Unique', $this->properties ?? []);
    }
}
