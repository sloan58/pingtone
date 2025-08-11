<?php

namespace App\Models;

use Exception;
use App\ApiClients\AxlSoap;
use App\Observers\UcmObserver;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;

#[ObservedBy([UcmObserver::class])]
class Ucm extends Model
{
    use HasFactory;

    protected $guarded = [];

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
     * Get the softkey templates associated with this UCM.
     */
    public function softkeyTemplates(): HasMany
    {
        return $this->hasMany(SoftkeyTemplate::class);
    }

    /**
     * Get the phone button templates associated with this UCM.
     */
    public function phoneButtonTemplates(): HasMany
    {
        return $this->hasMany(PhoneButtonTemplate::class);
    }

    public function routePartitions(): HasMany
    {
        return $this->hasMany(RoutePartition::class);
    }

    public function callingSearchSpaces(): HasMany
    {
        return $this->hasMany(CallingSearchSpace::class);
    }

    public function devicePools(): HasMany
    {
        return $this->hasMany(DevicePool::class);
    }

    public function serviceProfiles(): HasMany
    {
        return $this->hasMany(ServiceProfile::class);
    }

    public function sipProfiles(): HasMany
    {
        return $this->hasMany(SipProfile::class);
    }

    public function locations(): HasMany
    {
        return $this->hasMany(Location::class);
    }

    public function mediaResourceGroupLists(): HasMany
    {
        return $this->hasMany(MediaResourceGroupList::class);
    }

    public function mohAudioSources(): HasMany
    {
        return $this->hasMany(MohAudioSource::class);
    }

    public function aarGroups(): HasMany
    {
        return $this->hasMany(AarGroup::class);
    }

    public function userLocales(): HasMany
    {
        return $this->hasMany(UserLocale::class);
    }

    public function callPickupGroups(): HasMany
    {
        return $this->hasMany(CallPickupGroup::class);
    }

    public function commonPhoneConfigs(): HasMany
    {
        return $this->hasMany(CommonPhoneConfig::class);
    }

    public function commonDeviceConfigs(): HasMany
    {
        return $this->hasMany(CommonDeviceConfig::class);
    }

    public function lineGroups(): HasMany
    {
        return $this->hasMany(LineGroup::class);
    }

    public function intercoms(): HasMany
    {
        return $this->hasMany(Intercom::class);
    }

    // Phone vendor configs are embedded on Phone documents in this project

    public function deviceProfiles(): HasMany
    {
        return $this->hasMany(DeviceProfile::class);
    }

    public function remoteDestinationProfiles(): HasMany
    {
        return $this->hasMany(RemoteDestinationProfile::class);
    }

    public function remoteDestinations(): HasMany
    {
        return $this->hasMany(RemoteDestination::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(UcmRole::class);
    }

    /**
     * Get the UCM users associated with this UCM.
     */
    public function ucmUsers(): HasMany
    {
        return $this->hasMany(UcmUser::class);
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
     * @throws Exception
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
