<?php

namespace App\Models;

use Jenssegers\Mongodb\Eloquent\Model;

class PerfMonCounter extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'perfmon_counters';
    
    protected $fillable = [
        'ucm_id',
        'name',
        'object',
        'counter',
        'instances',
        'description',
        'enabled',
        'collection_interval',
        'aggregation_method',
        'threshold_warning',
        'threshold_critical',
        'metadata'
    ];

    protected $casts = [
        'instances' => 'array',
        'enabled' => 'boolean',
        'collection_interval' => 'integer',
        'threshold_warning' => 'float',
        'threshold_critical' => 'float',
        'metadata' => 'array'
    ];

    protected $attributes = [
        'enabled' => true,
        'collection_interval' => 300, // 5 minutes default
        'aggregation_method' => 'average',
        'instances' => []
    ];

    /**
     * Scope for enabled counters
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope for UCM
     */
    public function scopeForUcm($query, $ucmId)
    {
        return $query->where('ucm_id', $ucmId);
    }

    /**
     * Check if value exceeds thresholds
     */
    public function checkThresholds($value)
    {
        $status = 'normal';
        
        if ($this->threshold_critical && $value >= $this->threshold_critical) {
            $status = 'critical';
        } elseif ($this->threshold_warning && $value >= $this->threshold_warning) {
            $status = 'warning';
        }
        
        return $status;
    }

    /**
     * Get formatted name
     */
    public function getFormattedName()
    {
        return "{$this->object}\\{$this->counter}";
    }

    /**
     * Get default counters for initial setup
     */
    public static function getDefaultCounters($ucmId)
    {
        $defaults = [
            [
                'name' => 'CPU Utilization',
                'object' => 'Processor',
                'counter' => '% CPU Time',
                'description' => 'Overall CPU utilization percentage',
                'instances' => ['_Total'],
                'threshold_warning' => 70,
                'threshold_critical' => 90,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Memory Usage',
                'object' => 'Memory',
                'counter' => '% Mem Used',
                'description' => 'Memory utilization percentage',
                'instances' => [''],
                'threshold_warning' => 80,
                'threshold_critical' => 95,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'CCM Process CPU',
                'object' => 'Process',
                'counter' => '% CPU Time',
                'description' => 'CallManager process CPU utilization',
                'instances' => ['ccm'],
                'threshold_warning' => 50,
                'threshold_critical' => 75,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Tomcat Process CPU',
                'object' => 'Process',
                'counter' => '% CPU Time',
                'description' => 'Tomcat process CPU utilization',
                'instances' => ['tomcat'],
                'threshold_warning' => 50,
                'threshold_critical' => 75,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Registered Phones',
                'object' => 'Cisco CallManager',
                'counter' => 'RegisteredHardwarePhones',
                'description' => 'Number of registered hardware phones',
                'instances' => [''],
                'aggregation_method' => 'last'
            ],
            [
                'name' => 'Active Calls',
                'object' => 'Cisco CallManager',
                'counter' => 'CallsActive',
                'description' => 'Number of active calls',
                'instances' => [''],
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Calls Attempted',
                'object' => 'Cisco CallManager',
                'counter' => 'CallsAttempted',
                'description' => 'Number of calls attempted',
                'instances' => [''],
                'aggregation_method' => 'sum'
            ],
            [
                'name' => 'Calls Completed',
                'object' => 'Cisco CallManager',
                'counter' => 'CallsCompleted',
                'description' => 'Number of calls completed',
                'instances' => [''],
                'aggregation_method' => 'sum'
            ],
            [
                'name' => 'Active Partition Usage',
                'object' => 'Partition',
                'counter' => '% Used',
                'description' => 'Active partition disk usage',
                'instances' => ['active'],
                'threshold_warning' => 80,
                'threshold_critical' => 90,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Inactive Partition Usage',
                'object' => 'Partition',
                'counter' => '% Used',
                'description' => 'Inactive partition disk usage',
                'instances' => ['inactive'],
                'threshold_warning' => 80,
                'threshold_critical' => 90,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Common Partition Usage',
                'object' => 'Partition',
                'counter' => '% Used',
                'description' => 'Common partition disk usage',
                'instances' => ['common'],
                'threshold_warning' => 80,
                'threshold_critical' => 90,
                'aggregation_method' => 'average'
            ],
            [
                'name' => 'Network RX Packets',
                'object' => 'Network Interface',
                'counter' => 'Rx Packets',
                'description' => 'Network packets received',
                'instances' => ['eth0'],
                'aggregation_method' => 'sum'
            ],
            [
                'name' => 'Network TX Packets',
                'object' => 'Network Interface',
                'counter' => 'Tx Packets',
                'description' => 'Network packets transmitted',
                'instances' => ['eth0'],
                'aggregation_method' => 'sum'
            ]
        ];

        // Add UCM ID to each counter
        return collect($defaults)->map(function($counter) use ($ucmId) {
            $counter['ucm_id'] = $ucmId;
            $counter['enabled'] = true;
            $counter['collection_interval'] = 300;
            return $counter;
        })->toArray();
    }
}
