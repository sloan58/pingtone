<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Exception;

class Ucm extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'hostname',
        'username',
        'password',
        'schema_version',
        'version',
        'last_sync_at',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'last_sync_at' => 'datetime',
        'password' => 'encrypted',
    ];

    /**
     * The attributes that should be hidden for arrays.
     */
    protected $hidden = [
        'password',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'sync_status',
        'latest_sync_status',
    ];

    /**
     * Get the phones associated with this UCM.
     */
    public function phones(): HasMany
    {
        return $this->hasMany(Phone::class);
    }

    /**
     * Get the lines associated with this UCM.
     */
    public function lines(): HasMany
    {
        return $this->hasMany(Line::class);
    }

    /**
     * Get the users associated with this UCM.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the sync history for this UCM.
     */
    public function syncHistory(): MorphMany
    {
        return $this->morphMany(SyncHistory::class, 'syncable');
    }

    /**
     * Get the latest sync history entry.
     */
    public function latestSyncHistory()
    {
        return $this->syncHistory()->latest('sync_start_time')->first();
    }

    /**
     * Get the sync status for this UCM.
     */
    public function getSyncStatusAttribute(): string
    {
        $latestSync = $this->latestSyncHistory();
        
        if (!$latestSync) {
            return 'Never Synced';
        }

        if ($latestSync->isSyncing()) {
            return 'Syncing...';
        }

        if ($latestSync->isFailed()) {
            return 'Last Sync Failed';
        }

        if (!$this->last_sync_at) {
            return 'Never Synced';
        }

        $daysSinceLastSync = now()->diffInDays($this->last_sync_at);
        
        if ($daysSinceLastSync === 0) {
            return 'Synced Today';
        } elseif ($daysSinceLastSync === 1) {
            return 'Synced Yesterday';
        } else {
            return "Synced {$daysSinceLastSync} days ago";
        }
    }

    /**
     * Get the latest sync status enum value.
     */
    public function getLatestSyncStatusAttribute(): ?string
    {
        $latestSync = $this->latestSyncHistory();
        return $latestSync?->status?->value;
    }

    /**
     * Get the API versions available for UCM.
     */
    public static function getApiVersions(): array
    {
        $versions = Storage::disk('wsdl')->directories();

        // Sort versions numerically in descending order
        usort($versions, function($a, $b) {
            return version_compare($b, $a); // Reverse order for descending
        });

        // Convert to key-value pairs for the form
        $versionMap = [];
        foreach ($versions as $version) {
            $versionMap[$version] = "CUCM {$version}";
        }

        return $versionMap;
    }

    /**
     * Get the AXL API client for this UCM.
     */
    public function axlApi(): \App\ApiClients\AxlSoap
    {
        return new \App\ApiClients\AxlSoap($this);
    }

    /**
     * Fetch and update the UCM version using getCCMVersion API
     *
     * @return bool
     */
    public function updateVersionFromApi(): bool
    {
        try {
            $axlApi = $this->axlApi();
            $version = $axlApi->getCCMVersion();
            
            if ($version) {
                $this->update(['version' => $version]);
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            logger()->error(__METHOD__ . ': Failed to update version from API', [
                'ucm_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }
} 