<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class PhoneScreenCapture extends Model
{
    protected $fillable = [
        'phone_id',
        'filename',
        'file_path',
        'file_size',
        'mime_type',
        'captured_at',
        'captured_by',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
    ];

    /**
     * Get the phone that owns this screen capture.
     */
    public function phone(): BelongsTo
    {
        return $this->belongsTo(Phone::class, 'phone_id', '_id');
    }

    /**
     * Get the full URL to the image file.
     */
    public function getImageUrlAttribute(): string
    {
        return asset('storage/phone-captures/' . $this->phone_id . '/' . $this->filename);
    }

    /**
     * Get the file size in a human-readable format.
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = (int) $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}
