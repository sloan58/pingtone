<?php

namespace App\Models;

use Exception;
use App\ApiClients\AxlSoap;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

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
     * Get the recording profiles associated with this UCM.
     */
    public function recordingProfiles(): HasMany
    {
        return $this->hasMany(RecordingProfile::class);
    }

    /**
     * Get the voicemail profiles associated with this UCM.
     */
    public function voicemailProfiles(): HasMany
    {
        return $this->hasMany(VoicemailProfile::class);
    }

    /**
     * Get the phone models associated with this UCM.
     */
    public function phoneModels(): HasMany
    {
        return $this->hasMany(PhoneModel::class);
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
        usort($versions, function ($a, $b) {
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
    public function axlApi(): AxlSoap
    {
        return new AxlSoap($this);
    }

    /**
     * Fetch and update the UCM version using getCCMVersion API
     *
     * @return string|null
     */
    public function updateVersionFromApi(): ?string
    {
        try {
            $axlApi = $this->axlApi();
            $version = $axlApi->getCCMVersion();

            if ($version) {
                $this->update(['version' => $version]);
                return $version;
            }

            logger()->warning(__METHOD__ . ': No version returned from API', [
                'ucm_id' => $this->id,
            ]);
            return null;
        } catch (Exception $e) {
            logger()->error(__METHOD__ . ': Failed to update version from API', [
                'ucm_id' => $this->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
