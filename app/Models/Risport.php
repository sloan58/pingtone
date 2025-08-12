<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;
use Carbon\Carbon;

class Risport extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'risport';
    
    protected $fillable = [
        'ucm_id',
        'name',
        'ip_address',
        'ip_address_v6',
        'status',
        'status_reason',
        'node_name',
        'model',
        'product',
        'device_class',
        'protocol',
        'active_load_id',
        'inactive_load_id',
        'download_status',
        'download_failure_reason',
        'perfmon_object',
        'timestamp',
        'directory_number',
        'description',
        'http_support',
        'registered_at_timestamp',
        'metadata'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'registered_at_timestamp' => 'datetime',
        'http_support' => 'boolean',
        'metadata' => 'array'
    ];

    /**
     * Scope for UCM
     */
    public function scopeForUcm($query, $ucmId)
    {
        return $query->where('ucm_id', $ucmId);
    }

    /**
     * Scope for registered devices
     */
    public function scopeRegistered($query)
    {
        return $query->where('status', 'Registered');
    }

    /**
     * Scope for unregistered devices
     */
    public function scopeUnregistered($query)
    {
        return $query->whereIn('status', ['UnRegistered', 'Rejected', 'Unknown']);
    }

    /**
     * Scope for devices by node
     */
    public function scopeOnNode($query, $nodeName)
    {
        return $query->where('node_name', $nodeName);
    }

    /**
     * Get registration statistics
     */
    public static function getRegistrationStats($ucmId)
    {
        $stats = static::forUcm($ucmId)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();

        return [
            'registered' => $stats['Registered'] ?? 0,
            'unregistered' => $stats['UnRegistered'] ?? 0,
            'rejected' => $stats['Rejected'] ?? 0,
            'unknown' => $stats['Unknown'] ?? 0,
            'partially_registered' => $stats['PartiallyRegistered'] ?? 0,
            'total' => array_sum($stats)
        ];
    }

    /**
     * Get devices by registration status
     */
    public static function getDevicesByStatus($ucmId, $status = 'Registered')
    {
        return static::forUcm($ucmId)
            ->where('status', $status)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get stale devices (not updated recently)
     */
    public static function getStaleDevices($ucmId, $hours = 24)
    {
        $threshold = Carbon::now()->subHours($hours);
        
        return static::forUcm($ucmId)
            ->where('timestamp', '<', $threshold)
            ->orderBy('timestamp')
            ->get();
    }

    /**
     * Store device from API response
     */
    public static function storeFromApiResponse($deviceData, $ucmId, $nodeName)
    {
        $data = [
            'ucm_id' => $ucmId,
            'name' => $deviceData->Name ?? '',
            'ip_address' => isset($deviceData->IPAddress->item->IP) ? $deviceData->IPAddress->item->IP : null,
            'ip_address_v6' => isset($deviceData->IPAddress->item->IPv6) ? $deviceData->IPAddress->item->IPv6 : null,
            'status' => $deviceData->Status ?? 'Unknown',
            'status_reason' => $deviceData->StatusReason ?? null,
            'node_name' => $nodeName,
            'model' => $deviceData->Model ?? null,
            'product' => $deviceData->Product ?? null,
            'device_class' => $deviceData->Class ?? null,
            'protocol' => $deviceData->Protocol ?? null,
            'active_load_id' => $deviceData->ActiveLoadID ?? null,
            'inactive_load_id' => $deviceData->InactiveLoadID ?? null,
            'download_status' => $deviceData->DownloadStatus ?? null,
            'download_failure_reason' => $deviceData->DownloadFailureReason ?? null,
            'perfmon_object' => $deviceData->PerfMonObject ?? null,
            'timestamp' => now(),
            'directory_number' => isset($deviceData->LinesStatus->item->DirectoryNumber) 
                ? $deviceData->LinesStatus->item->DirectoryNumber 
                : null,
            'description' => $deviceData->Description ?? null,
            'http_support' => isset($deviceData->HttpSupport) && $deviceData->HttpSupport === 'Yes',
            'registered_at_timestamp' => isset($deviceData->TimeStamp) 
                ? Carbon::createFromTimestamp($deviceData->TimeStamp) 
                : null,
            'metadata' => [
                'is_cti_controllable' => isset($deviceData->IsCtiControllable) && $deviceData->IsCtiControllable === true,
                'login_user_id' => $deviceData->LoginUserID ?? null,
                'ip_attribute' => isset($deviceData->IPAddress->item->IPAddrType) 
                    ? $deviceData->IPAddress->item->IPAddrType 
                    : null
            ]
        ];

        return static::updateOrCreate(
            [
                'ucm_id' => $ucmId,
                'name' => $data['name']
            ],
            $data
        );
    }

    /**
     * Get registration trend data
     */
    public static function getRegistrationTrend($ucmId, $hours = 24)
    {
        $startTime = Carbon::now()->subHours($hours);
        
        $pipeline = [
            [
                '$match' => [
                    'ucm_id' => $ucmId,
                    'timestamp' => ['$gte' => $startTime]
                ]
            ],
            [
                '$group' => [
                    '_id' => [
                        'hour' => ['$hour' => '$timestamp'],
                        'day' => ['$dayOfMonth' => '$timestamp'],
                        'status' => '$status'
                    ],
                    'count' => ['$sum' => 1]
                ]
            ],
            [
                '$group' => [
                    '_id' => [
                        'hour' => '$_id.hour',
                        'day' => '$_id.day'
                    ],
                    'statuses' => [
                        '$push' => [
                            'status' => '$_id.status',
                            'count' => '$count'
                        ]
                    ]
                ]
            ],
            [
                '$sort' => ['_id.day' => 1, '_id.hour' => 1]
            ]
        ];

        $results = \DB::connection('mongodb')
            ->collection('risport')
            ->raw(function($collection) use ($pipeline) {
                return $collection->aggregate($pipeline);
            });

        return collect($results);
    }
}
