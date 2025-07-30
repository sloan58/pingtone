<?php

namespace App\Models;

use App\Enums\SyncStatusEnum;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SyncHistory extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'syncable_type',
        'syncable_id',
        'sync_start_time',
        'sync_end_time',
        'status',
        'error',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'sync_start_time' => 'datetime',
        'sync_end_time' => 'datetime',
        'status' => SyncStatusEnum::class,
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'formatted_duration',
    ];

    /**
     * Get the parent syncable model.
     */
    public function syncable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the latest sync history for a model.
     */
    public static function getLatestFor($model): ?self
    {
        return static::where('syncable_type', get_class($model))
            ->where('syncable_id', $model->id)
            ->latest('sync_start_time')
            ->first();
    }

    /**
     * Check if the sync is currently in progress.
     */
    public function isSyncing(): bool
    {
        return $this->status === SyncStatusEnum::SYNCING;
    }

    /**
     * Check if the sync completed successfully.
     */
    public function isCompleted(): bool
    {
        return $this->status === SyncStatusEnum::COMPLETED;
    }

    /**
     * Check if the sync failed.
     */
    public function isFailed(): bool
    {
        return $this->status === SyncStatusEnum::FAILED;
    }

    /**
     * Get the duration of the sync in seconds.
     */
    public function getDurationAttribute(): ?int
    {
        if (!$this->sync_start_time || !$this->sync_end_time) {
            return null;
        }

        return $this->sync_start_time->diffInSeconds($this->sync_end_time);
    }

    /**
     * Get the formatted duration string.
     */
    public function getFormattedDurationAttribute(): ?string
    {
        if (!$this->duration) {
            return null;
        }

        if ($this->duration < 60) {
            return "{$this->duration}s";
        }

        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;

        return "{$minutes}m {$seconds}s";
    }
}
