<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class PerfMonMetric extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'perfmon_metrics';
    
    protected $fillable = [
        'ucm_id',
        'timestamp',
        'host',
        'object',
        'counter',
        'instance',
        'value',
        'metadata'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'value' => 'float',
        'metadata' => 'array'
    ];

    /**
     * Scope for filtering by UCM
     */
    public function scopeForUcm($query, $ucmId)
    {
        return $query->where('ucm_id', $ucmId);
    }

    /**
     * Scope for filtering by host
     */
    public function scopeForHost($query, $host)
    {
        return $query->where('host', $host);
    }

    /**
     * Scope for filtering by counter
     */
    public function scopeForCounter($query, $object, $counter, $instance = null)
    {
        $query->where('object', $object)->where('counter', $counter);
        
        if ($instance !== null) {
            $query->where('instance', $instance);
        }
        
        return $query;
    }

    /**
     * Scope for date range
     */
    public function scopeDateRange($query, $start, $end)
    {
        return $query->whereBetween('timestamp', [$start, $end]);
    }

    /**
     * Get aggregated metrics for charting
     */
    public static function getAggregatedMetrics($ucmId, $host, $object, $counter, $instance, $startTime, $endTime, $interval = '5m')
    {
        // Convert interval to seconds
        $intervalSeconds = match($interval) {
            '1m' => 60,
            '5m' => 300,
            '15m' => 900,
            '30m' => 1800,
            '1h' => 3600,
            '6h' => 21600,
            '12h' => 43200,
            '1d' => 86400,
            default => 300
        };

        $pipeline = [
            [
                '$match' => [
                    'ucm_id' => $ucmId,
                    'host' => $host,
                    'object' => $object,
                    'counter' => $counter,
                    'instance' => $instance,
                    'timestamp' => [
                        '$gte' => $startTime,
                        '$lte' => $endTime
                    ]
                ]
            ],
            [
                '$group' => [
                    '_id' => [
                        '$subtract' => [
                            '$timestamp',
                            ['$mod' => ['$timestamp', $intervalSeconds * 1000]]
                        ]
                    ],
                    'avg_value' => ['$avg' => '$value'],
                    'min_value' => ['$min' => '$value'],
                    'max_value' => ['$max' => '$value'],
                    'count' => ['$sum' => 1]
                ]
            ],
            [
                '$sort' => ['_id' => 1]
            ],
            [
                '$project' => [
                    'timestamp' => '$_id',
                    'avg_value' => 1,
                    'min_value' => 1,
                    'max_value' => 1,
                    'count' => 1,
                    '_id' => 0
                ]
            ]
        ];

        $results = DB::connection('mongodb')
            ->collection('perfmon_metrics')
            ->raw(function($collection) use ($pipeline) {
                return $collection->aggregate($pipeline);
            });

        return collect($results)->map(function($item) {
            return [
                'timestamp' => $item->timestamp,
                'value' => round($item->avg_value, 2),
                'min' => round($item->min_value, 2),
                'max' => round($item->max_value, 2),
                'samples' => $item->count
            ];
        });
    }

    /**
     * Get latest metrics for dashboard
     */
    public static function getDashboardMetrics($ucmId, $host = null)
    {
        $query = static::where('ucm_id', $ucmId);
        
        if ($host) {
            $query->where('host', $host);
        }

        // Get latest value for each counter
        $pipeline = [
            [
                '$match' => $query->getQuery()->wheres[0] ?? []
            ],
            [
                '$sort' => ['timestamp' => -1]
            ],
            [
                '$group' => [
                    '_id' => [
                        'host' => '$host',
                        'object' => '$object',
                        'counter' => '$counter',
                        'instance' => '$instance'
                    ],
                    'latest_value' => ['$first' => '$value'],
                    'latest_timestamp' => ['$first' => '$timestamp'],
                    'metadata' => ['$first' => '$metadata']
                ]
            ],
            [
                '$project' => [
                    'host' => '$_id.host',
                    'object' => '$_id.object',
                    'counter' => '$_id.counter',
                    'instance' => '$_id.instance',
                    'value' => '$latest_value',
                    'timestamp' => '$latest_timestamp',
                    'metadata' => 1,
                    '_id' => 0
                ]
            ]
        ];

        $results = DB::connection('mongodb')
            ->collection('perfmon_metrics')
            ->raw(function($collection) use ($pipeline) {
                return $collection->aggregate($pipeline);
            });

        return collect($results);
    }
}
