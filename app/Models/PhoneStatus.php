<?php

namespace App\Models;

use Log;
use Carbon\Carbon;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Collection;
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
    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
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
     * @param UcmCluster $ucmCluster The UCM instance
     * @return void
     */
    public static function storeFromRisPortData(array $risPortData, UcmCluster $ucmCluster): void
    {
        $timestamp = new UTCDateTime();
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
                    'ucm_cluster_id' => $ucmCluster->id,
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

            Log::info("Stored phone status data from RisPort", [
                'ucm' => $ucmCluster->name,
                'inserted_count' => $result->getInsertedCount(),
                'timestamp' => $timestamp->toDateTime()->format('c'),
            ]);
        }
    }

    /**
     * Get the latest status for a specific phone
     *
     * @param string $phoneName
     * @param UcmCluster $ucmCluster
     * @return self|null
     */
    public static function getLatestForPhone(string $phoneName, UcmCluster $ucmCluster): ?self
    {
        return self::where([
            'phone_name' => $phoneName,
            'ucm_cluster_id' => $ucmCluster->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->first();
    }

    /**
     * Get phone status history for a specific phone
     *
     * @param string $phoneName
     * @param UcmNode $ucm
     * @param int $limit
     * @return Collection
     */
    public static function getHistoryForPhone(string $phoneName, UcmNode $ucm, int $limit = 100): Collection
    {
        return self::where([
            'phone_name' => $phoneName,
            'ucm_cluster_id' => $ucm->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->limit($limit)
        ->get();
    }

    /**
     * Get all phone statuses for a UCM within a time range
     *
     * @param UcmNode $ucm
     * @param Carbon $startTime
     * @param Carbon $endTime
     * @return Collection
     */
    public static function getForUcmInTimeRange(UcmNode $ucm, $startTime, $endTime): Collection
    {
        return self::where([
            'ucm_cluster_id' => $ucm->id,
        ])
        ->whereBetween('timestamp', [$startTime, $endTime])
        ->orderBy('timestamp', 'desc')
        ->get();
    }

    /**
     * Get summary statistics for a UCM
     *
     * @param UcmNode $ucm
     * @param Carbon|null $since
     * @return array
     */
    public static function getSummaryForUcm(UcmNode $ucm, ?Carbon $since = null): array
    {
        $query = self::where('ucm_cluster_id', $ucm->id);

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
