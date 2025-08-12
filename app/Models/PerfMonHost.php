<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;
use Carbon\Carbon;

class PerfMonHost extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'perfmon_hosts';
    
    protected $fillable = [
        'ucm_id',
        'hostname',
        'ip_address',
        'node_type',
        'status',
        'last_collection',
        'collection_enabled',
        'metadata'
    ];

    protected $casts = [
        'last_collection' => 'datetime',
        'collection_enabled' => 'boolean',
        'metadata' => 'array'
    ];

    protected $attributes = [
        'status' => 'unknown',
        'collection_enabled' => true,
        'node_type' => 'publisher'
    ];

    /**
     * Scope for UCM
     */
    public function scopeForUcm($query, $ucmId)
    {
        return $query->where('ucm_id', $ucmId);
    }

    /**
     * Scope for enabled hosts
     */
    public function scopeEnabled($query)
    {
        return $query->where('collection_enabled', true);
    }

    /**
     * Update last collection timestamp
     */
    public function touchLastCollection()
    {
        $this->last_collection = now();
        $this->save();
    }

    /**
     * Check if collection is overdue
     */
    public function isCollectionOverdue($thresholdMinutes = 10)
    {
        if (!$this->last_collection) {
            return true;
        }

        return $this->last_collection->diffInMinutes(now()) > $thresholdMinutes;
    }

    /**
     * Get latest system metrics
     */
    public function getLatestSystemMetrics()
    {
        $metrics = PerfMonMetric::where('ucm_id', $this->ucm_id)
            ->where('host', $this->hostname)
            ->whereIn('object', ['Processor', 'Memory', 'Partition'])
            ->orderBy('timestamp', 'desc')
            ->limit(20)
            ->get()
            ->groupBy(function($item) {
                return "{$item->object}\\{$item->counter}\\{$item->instance}";
            })
            ->map(function($group) {
                return $group->first();
            });

        return [
            'cpu' => $metrics->filter(function($m) {
                return $m->object === 'Processor' && $m->counter === '% CPU Time' && $m->instance === '_Total';
            })->first()->value ?? 0,
            
            'memory' => $metrics->filter(function($m) {
                return $m->object === 'Memory' && $m->counter === '% Mem Used';
            })->first()->value ?? 0,
            
            'disk' => $metrics->filter(function($m) {
                return $m->object === 'Partition' && $m->counter === '% Used';
            })->map(function($m) {
                return [
                    'partition' => $m->instance,
                    'usage' => $m->value
                ];
            })->values()->toArray()
        ];
    }

    /**
     * Get health status based on metrics
     */
    public function getHealthStatus()
    {
        if (!$this->last_collection) {
            return 'unknown';
        }

        // Check if data is stale
        if ($this->isCollectionOverdue()) {
            return 'stale';
        }

        // Get latest metrics
        $systemMetrics = $this->getLatestSystemMetrics();

        // Check thresholds
        if ($systemMetrics['cpu'] > 90 || $systemMetrics['memory'] > 95) {
            return 'critical';
        }

        if ($systemMetrics['cpu'] > 70 || $systemMetrics['memory'] > 80) {
            return 'warning';
        }

        // Check disk usage
        foreach ($systemMetrics['disk'] as $disk) {
            if ($disk['usage'] > 90) {
                return 'critical';
            }
            if ($disk['usage'] > 80) {
                return 'warning';
            }
        }

        return 'healthy';
    }

    /**
     * Get status badge color
     */
    public function getStatusColor()
    {
        return match($this->getHealthStatus()) {
            'healthy' => 'green',
            'warning' => 'yellow',
            'critical' => 'red',
            'stale' => 'gray',
            default => 'gray'
        };
    }
}
