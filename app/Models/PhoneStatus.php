<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneStatus extends Model
{
    protected $table = 'phone_statuses';
    
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'timestamp' => 'datetime',
    ];

    /**
     * The attributes that should be mutated to dates.
     */
    protected $dates = [
        'timestamp',
    ];

    /**
     * Get the UCM that owns this phone status record.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get the phone that this status record belongs to.
     */
    public function phone(): BelongsTo
    {
        return $this->belongsTo(Phone::class);
    }

    /**
     * Store phone status data from RisPort API response
     *
     * @param array $risPortData Complete RisPort API response
     * @param Ucm $ucm The UCM instance
     * @return void
     */
    public static function storeFromRisPortData(array $risPortData, Ucm $ucm): void
    {
        $timestamp = new \MongoDB\BSON\UTCDateTime();
        $operations = [];

        // Extract phone data from the RisPort response
        $cmNodes = $risPortData['selectCmDeviceReturn']['SelectCmDeviceResult']['CmNodes']['item'] ?? [];

        // Ensure we have an array of nodes
        if (!is_array($cmNodes)) {
            $cmNodes = [$cmNodes];
        }

        foreach ($cmNodes as $cmNode) {
            if (empty($cmNode['CmDevices']['item'] ?? null)) {
                continue;
            }

            $devices = $cmNode['CmDevices']['item'];

            // Ensure we have an array of devices
            if (!is_array($devices)) {
                $devices = [$devices];
            }

            foreach ($devices as $device) {
                if (empty($device['Name'] ?? null)) {
                    continue;
                }

                // Create the status record with complete device data
                $statusData = [
                    'phone_name' => $device['Name'],
                    'ucm_id' => $ucm->id,
                    'timestamp' => $timestamp,
                    'cm_node' => $cmNode['Name'] ?? null,
                    'device_data' => $device, // Store complete device data
                ];

                $operations[] = [
                    'insertOne' => [
                        $statusData
                    ]
                ];
            }
        }

        if (!empty($operations)) {
            $result = self::raw()->bulkWrite($operations);

            \Log::info("Stored phone status data from RisPort", [
                'ucm' => $ucm->name,
                'inserted_count' => $result->getInsertedCount(),
                'timestamp' => $timestamp->toDateTime()->format('c'),
            ]);
        }
    }

    /**
     * Get the latest status for a specific phone
     *
     * @param string $phoneName
     * @param Ucm $ucm
     * @return self|null
     */
    public static function getLatestForPhone(string $phoneName, Ucm $ucm): ?self
    {
        return self::where([
            'phone_name' => $phoneName,
            'ucm_id' => $ucm->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->first();
    }

    /**
     * Get phone status history for a specific phone
     *
     * @param string $phoneName
     * @param Ucm $ucm
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getHistoryForPhone(string $phoneName, Ucm $ucm, int $limit = 100)
    {
        return self::where([
            'phone_name' => $phoneName,
            'ucm_id' => $ucm->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->limit($limit)
        ->get();
    }

    /**
     * Get all phone statuses for a UCM within a time range
     *
     * @param Ucm $ucm
     * @param \Carbon\Carbon $startTime
     * @param \Carbon\Carbon $endTime
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getForUcmInTimeRange(Ucm $ucm, $startTime, $endTime)
    {
        return self::where([
            'ucm_id' => $ucm->id,
        ])
        ->whereBetween('timestamp', [$startTime, $endTime])
        ->orderBy('timestamp', 'desc')
        ->get();
    }

    /**
     * Get summary statistics for a UCM
     *
     * @param Ucm $ucm
     * @param \Carbon\Carbon|null $since
     * @return array
     */
    public static function getSummaryForUcm(Ucm $ucm, $since = null): array
    {
        $query = self::where('ucm_id', $ucm->id);

        if ($since) {
            $query->where('timestamp', '>=', $since);
        }

        $latestRecords = $query->orderBy('timestamp', 'desc')
            ->limit(1000)
            ->get();

        $statusCounts = [];
        $nodeCounts = [];
        $totalPhones = 0;

        foreach ($latestRecords as $record) {
            $deviceData = $record->device_data ?? [];
            $status = $deviceData['Status'] ?? 'Unknown';
            $node = $record->cm_node ?? 'Unknown';

            $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;
            $nodeCounts[$node] = ($nodeCounts[$node] ?? 0) + 1;
            $totalPhones++;
        }

        return [
            'total_phones' => $totalPhones,
            'status_breakdown' => $statusCounts,
            'node_breakdown' => $nodeCounts,
            'last_updated' => $latestRecords->first()?->timestamp,
        ];
    }
}
