<?php

namespace App\Models;

use Log;
use MongoDB\Laravel\Relations\HasMany;
use MongoDB\Laravel\Relations\BelongsTo;

class Phone extends Device
{
    /**
     * Get the device class for this model
     */
    protected static function getDeviceClass(): string
    {
        return 'Phone';
    }

    /**
     * Get the device status records for this device.
     */
    public function statuses(): HasMany
    {
        return $this->hasMany(PhoneStatus::class, 'phone_name', 'name');
    }

    /**
     * Get the screen captures for this device.
     */
    public function screenCaptures(): HasMany
    {
        return $this->hasMany(PhoneScreenCapture::class, 'phone_id', '_id');
    }

    /**
     * Get the calling search space for this phone.
     */
    public function callingSearchSpace(): BelongsTo
    {
        return $this->belongsTo(CallingSearchSpace::class, 'callingSearchSpaceName._', 'name')
            ->where('ucm_cluster_id', $this->ucm_cluster_id);
    }

    /**
     * Get the calling search space name.
     */
    public function getCallingSearchSpaceNameAttribute(): ?string
    {
        return $this->callingSearchSpaceName['_'] ?? null;
    }

    /**
     * Get the calling search space name for filtering (computed field).
     */
    public function getCallingSearchSpaceNameFilterAttribute(): ?string
    {
        return $this->callingSearchSpaceName['_'] ?? null;
    }


    /**
     * Get the current IP address from the latest status record.
     */
    public function getCurrentIpAddressAttribute(): ?string
    {
        $latestStatus = $this->latest_status;

        if (!$latestStatus || !isset($latestStatus->device_data['IPAddress']['item'])) {
            return null;
        }

        $ipAddresses = $latestStatus->device_data['IPAddress']['item'];
        if (is_array($ipAddresses) && count($ipAddresses) > 0) {
            return $ipAddresses[0]['IP'] ?? null;
        }

        return null;
    }

    public function getLatestStatusAttribute(): ?PhoneStatus
    {
        return $this->statuses()
            ->orderBy('timestamp', 'desc')
            ->first();
    }

    /**
     * Get the current status from the latest status record.
     */
    public function getCurrentStatusAttribute(): ?string
    {
        $latestStatus = $this->statuses()
            ->orderBy('timestamp', 'desc')
            ->first();

        if (!$latestStatus || !isset($latestStatus->device_data['Status'])) {
            return null;
        }

        return $latestStatus->device_data['Status'];
    }

    /**
     * Store UCM details for this device
     */
    public static function storeUcmDetails(array $device, UcmCluster $ucmCluster): void
    {
        $device['ucm_cluster_id'] = $ucmCluster->id;
        $device['class'] = static::getDeviceClass();
        self::updateOrCreate(['uuid' => $device['uuid']], $device)->touch();
    }

    /**
     * Update device lastx statistics using bulk operations
     */
    public static function updateLastXStats(array $stats, UcmCluster $ucmCluster): void
    {
        foreach (array_chunk($stats, 1000) as $chunk) {
            $operations = [];
            foreach ($chunk as $stat) {
                $operations[] = [
                    'updateOne' => [
                        [
                            'uuid' => "{{$stat['uuid']}}",
                            'ucm_cluster_id' => $ucmCluster->id,
                            'class' => static::getDeviceClass()
                        ],
                        [
                            '$set' => ['lastx' => $stat]
                        ]
                    ]
                ];
            }

            $result = self::raw()->bulkWrite($operations);

            Log::info("Bulk updated device stats", [
                'ucm_cluster_id' => $ucmCluster->id,
                'device_class' => static::getDeviceClass(),
                'matched_count' => $result->getMatchedCount(),
                'modified_count' => $result->getModifiedCount(),
                'stats_count' => count($stats)
            ]);
        }
    }

    /**
     * Check if this phone can perform screen captures.
     */
    public function canScreenCapture(): bool
    {
        // Check if phone is registered and has an IP address
        if (!$this->currentIpAddress || $this->currentStatus !== 'Registered') {
            Log::info('Phone screen capture check failed - IP or status', [
                'phone_id' => $this->_id,
                'phone_name' => $this->name,
                'currentIpAddress' => $this->currentIpAddress,
                'currentStatus' => $this->currentStatus,
            ]);
            return false;
        }

        // Check if phone model supports screen capture (Cisco 6xxx, 7xxx, 8xxx, 9xxx series)
        if (!preg_match('/^Cisco [6789]\d{3}N?R?$/', $this->model)) {
            Log::info('Phone screen capture check failed - model not supported', [
                'phone_id' => $this->_id,
                'phone_name' => $this->name,
                'model' => $this->model,
            ]);
            return false;
        }

        // Check if UCM credentials are available
        if (!$this->ucmCluster || !$this->ucmCluster->username || !$this->ucmCluster->password) {
            Log::info('Phone screen capture check failed - UCM credentials', [
                'phone_id' => $this->_id,
                'phone_name' => $this->name,
                'has_ucm' => (bool)$this->ucm,
                'has_username' => $this->ucm ? (bool)$this->ucm->username : false,
                'has_password' => $this->ucm ? (bool)$this->ucm->password : false,
            ]);
            return false;
        }

        Log::info('Phone screen capture check passed', [
            'phone_id' => $this->_id,
            'phone_name' => $this->name,
            'model' => $this->model,
            'currentStatus' => $this->currentStatus,
            'currentIpAddress' => $this->currentIpAddress,
        ]);

        return true;
    }
}
