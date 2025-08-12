<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneApi extends Model
{
    protected $table = 'phone_apis';
    
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
     * Get the UCM that owns this phone API record.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Get the phone that this API record belongs to.
     */
    public function phone(): BelongsTo
    {
        return $this->belongsTo(Phone::class);
    }

    /**
     * Store phone API data from API responses
     *
     * @param array $apiData Array of API response data
     * @param Ucm $ucm The UCM instance
     * @return void
     */
    public static function storeFromApiData(array $apiData, Ucm $ucm): void
    {
        $timestamp = new \MongoDB\BSON\UTCDateTime();
        $operations = [];

        foreach ($apiData as $record) {
            if (empty($record['phone_name'] ?? null)) {
                continue;
            }

            // Create the API record with complete data
            $apiRecordData = [
                'phone_name' => $record['phone_name'],
                'phone_id' => $record['phone_id'] ?? null,
                'ucm_id' => $ucm->id,
                'ip_address' => $record['ip_address'] ?? null,
                'api_type' => $record['api_type'] ?? null,
                'data' => $record['data'] ?? null,
                'error' => $record['error'] ?? null,
                'success' => $record['success'] ?? false,
                'timestamp' => $timestamp,
            ];

            $operations[] = [
                'insertOne' => [
                    $apiRecordData
                ]
            ];
        }

        if (!empty($operations)) {
            $result = self::raw()->bulkWrite($operations);

            \Log::info("Stored phone API data", [
                'ucm' => $ucm->name,
                'inserted_count' => $result->getInsertedCount(),
                'timestamp' => $timestamp->toDateTime()->format('c'),
            ]);
        }
    }

    /**
     * Get the latest API data for a specific phone and API type
     *
     * @param string $phoneName
     * @param string $apiType
     * @param Ucm $ucm
     * @return self|null
     */
    public static function getLatestForPhone(string $phoneName, string $apiType, Ucm $ucm): ?self
    {
        return self::where([
            'phone_name' => $phoneName,
            'api_type' => $apiType,
            'ucm_id' => $ucm->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->first();
    }

    /**
     * Get API data history for a specific phone and API type
     *
     * @param string $phoneName
     * @param string $apiType
     * @param Ucm $ucm
     * @param int $limit
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getHistoryForPhone(string $phoneName, string $apiType, Ucm $ucm, int $limit = 100)
    {
        return self::where([
            'phone_name' => $phoneName,
            'api_type' => $apiType,
            'ucm_id' => $ucm->id,
        ])
        ->orderBy('timestamp', 'desc')
        ->limit($limit)
        ->get();
    }

    /**
     * Get all API data for a UCM within a time range
     *
     * @param Ucm $ucm
     * @param \Carbon\Carbon $startTime
     * @param \Carbon\Carbon $endTime
     * @param string|null $apiType Optional filter by API type
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getForUcmInTimeRange(Ucm $ucm, $startTime, $endTime, ?string $apiType = null)
    {
        $query = self::where([
            'ucm_id' => $ucm->id,
        ])
        ->whereBetween('timestamp', [$startTime, $endTime]);

        if ($apiType) {
            $query->where('api_type', $apiType);
        }

        return $query->orderBy('timestamp', 'desc')->get();
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

        $apiTypeCounts = [];
        $successCounts = [];
        $phoneCounts = [];
        $totalRecords = 0;

        foreach ($latestRecords as $record) {
            $apiType = $record->api_type ?? 'Unknown';
            $success = $record->success ? 'success' : 'failed';
            $phoneName = $record->phone_name ?? 'Unknown';

            $apiTypeCounts[$apiType] = ($apiTypeCounts[$apiType] ?? 0) + 1;
            $successCounts[$success] = ($successCounts[$success] ?? 0) + 1;
            $phoneCounts[$phoneName] = ($phoneCounts[$phoneName] ?? 0) + 1;
            $totalRecords++;
        }

        return [
            'total_records' => $totalRecords,
            'api_type_breakdown' => $apiTypeCounts,
            'success_breakdown' => $successCounts,
            'phone_breakdown' => $phoneCounts,
            'last_updated' => $latestRecords->first()?->timestamp,
        ];
    }

    /**
     * Get the latest device information for a phone
     *
     * @param string $phoneName
     * @param Ucm $ucm
     * @return self|null
     */
    public static function getLatestDeviceInfo(string $phoneName, Ucm $ucm): ?self
    {
        return self::getLatestForPhone($phoneName, 'device_info', $ucm);
    }

    /**
     * Get the latest network configuration for a phone
     *
     * @param string $phoneName
     * @param Ucm $ucm
     * @return self|null
     */
    public static function getLatestNetworkConfig(string $phoneName, Ucm $ucm): ?self
    {
        return self::getLatestForPhone($phoneName, 'network_config', $ucm);
    }
}
