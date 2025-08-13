<?php

namespace App\Models;

use Log;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\HasMany;
use MongoDB\Laravel\Relations\BelongsTo;

class Phone extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get the phone status records for this phone.
     */
    public function statuses(): HasMany
    {
        return $this->hasMany(PhoneStatus::class, 'phone_name', 'name');
    }

    /**
     * Get the screen captures for this phone.
     */
    public function screenCaptures(): HasMany
    {
        return $this->hasMany(PhoneScreenCapture::class, 'phone_id', '_id');
    }

    /**
     * Get the current IP address from the latest PhoneStatus record.
     */
    public function getCurrentIpAddressAttribute(): ?string
    {
        $latestStatus = $this->statuses()
            ->orderBy('timestamp', 'desc')
            ->first();

        if (!$latestStatus || !isset($latestStatus->device_data['IPAddress']['item'])) {
            return null;
        }

        $ipAddresses = $latestStatus->device_data['IPAddress']['item'];
        if (is_array($ipAddresses) && count($ipAddresses) > 0) {
            return $ipAddresses[0]['IP'] ?? null;
        }

        return null;
    }

    /**
     * Get the current status from the latest PhoneStatus record.
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
        if (!$this->ucm || !$this->ucm->username || !$this->ucm->password) {
            Log::info('Phone screen capture check failed - UCM credentials', [
                'phone_id' => $this->_id,
                'phone_name' => $this->name,
                'has_ucm' => (bool) $this->ucm,
                'has_username' => $this->ucm ? (bool) $this->ucm->username : false,
                'has_password' => $this->ucm ? (bool) $this->ucm->password : false,
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

    public static function storeUcmDetails(array $phone, Ucm $ucm): void
    {
        $phone['ucm_id'] = $ucm->id;
        $model = self::updateOrCreate(['uuid' => $phone['uuid']], $phone);
        $model->touch();
    }

    /**
     * Update phone lastx statistics using bulk operations
     */
    public static function updateLastXStats(array $stats, Ucm $ucm): void
    {
        $operations = [];
        foreach ($stats as $stat) {
            $operations[] = [
                'updateOne' => [
                    [
                        'uuid' => "{{$stat['uuid']}}",
                        'ucm_id' => $ucm->id
                    ],
                    [
                        '$set' => ['lastx' => $stat]
                    ]
                ]
            ];
        }

        $result = self::raw()->bulkWrite($operations);

        Log::info("Bulk updated phone stats", [
            'ucm_id' => $ucm->id,
            'matched_count' => $result->getMatchedCount(),
            'modified_count' => $result->getModifiedCount(),
            'stats_count' => count($stats)
        ]);
    }
}
