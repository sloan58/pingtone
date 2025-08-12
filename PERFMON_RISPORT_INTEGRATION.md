# PerfMon and RISPort Integration - Remaining Implementation

This document contains all the remaining code needed to complete the PerfMon and RISPort integration.

## ✅ Already Committed to Branch

The following files have been created and pushed to the `feature/perfmon-risport-integration` branch:

- ✅ `app/ApiClients/PerfMonSoap.php` - PerfMon SOAP client
- ✅ `app/ApiClients/RisPortSoap.php` - RISPort SOAP client  
- ✅ `app/Models/PerfMonMetric.php` - PerfMon metrics model
- ✅ `app/Models/PerfMonCounter.php` - PerfMon counters model
- ✅ `app/Models/PerfMonHost.php` - PerfMon hosts model
- ✅ `app/Models/Risport.php` - RISPort data model
- ✅ `app/Console/Commands/CollectPerfMonMetrics.php` - PerfMon collection command

## 📝 Files Still Needed

### 1. Create RISPort Collection Command

**File:** `app/Console/Commands/CollectRisportData.php`

```php
<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Ucm;
use App\Models\Phone;
use App\Jobs\CollectRisportDataJob;

class CollectRisportData extends Command
{
    protected $signature = 'risport:collect 
                            {--ucm= : UCM ID to collect from}
                            {--all : Collect from all active UCMs}
                            {--phones= : Comma-separated list of phone names}
                            {--batch=1000 : Number of phones per batch}
                            {--sync : Run synchronously instead of queueing}';

    protected $description = 'Collect RISPort registration data for phones';

    public function handle()
    {
        $ucms = $this->getTargetUcms();

        if ($ucms->isEmpty()) {
            $this->error('No UCMs found for collection');
            return 1;
        }

        $this->info("Starting RISPort collection for {$ucms->count()} UCM(s)");

        foreach ($ucms as $ucm) {
            $this->info("Processing UCM: {$ucm->name} ({$ucm->ipAddress})");

            // Get phones to check
            $phones = $this->getPhonesToCheck($ucm);

            if ($phones->isEmpty()) {
                $this->warn("No phones found for UCM {$ucm->name}");
                continue;
            }

            $this->info("  Found {$phones->count()} phones to check");

            // Process in batches
            $batchSize = (int) $this->option('batch');
            $batches = $phones->chunk($batchSize);

            foreach ($batches as $index => $batch) {
                $batchNum = $index + 1;
                $this->info("  Processing batch {$batchNum} ({$batch->count()} phones)");

                if ($this->option('sync')) {
                    // Run synchronously
                    $job = new CollectRisportDataJob($ucm, $batch->pluck('name')->toArray());
                    $job->handle();
                    $this->info("  ✓ Batch {$batchNum} completed");
                } else {
                    // Queue the job
                    CollectRisportDataJob::dispatch($ucm, $batch->pluck('name')->toArray())
                        ->delay(now()->addSeconds($index * 5)); // Stagger batches
                    $this->info("  ✓ Batch {$batchNum} queued");
                }
            }
        }

        $this->info('RISPort collection initiated successfully');
        return 0;
    }

    protected function getTargetUcms()
    {
        if ($this->option('all')) {
            return Ucm::where('active', true)->get();
        }

        if ($ucmId = $this->option('ucm')) {
            $ucm = Ucm::find($ucmId);
            return $ucm ? collect([$ucm]) : collect();
        }

        // Default to first active UCM
        $ucm = Ucm::where('active', true)->first();
        return $ucm ? collect([$ucm]) : collect();
    }

    protected function getPhonesToCheck($ucm)
    {
        if ($phoneList = $this->option('phones')) {
            $phoneNames = array_map('trim', explode(',', $phoneList));
            return Phone::whereIn('name', $phoneNames)
                ->where('ucm_id', $ucm->id)
                ->get();
        }

        // Get all phones for this UCM
        return Phone::where('ucm_id', $ucm->id)->get();
    }
}
```

### 2. Create PerfMon Collection Job

**File:** `app/Jobs/CollectPerfMonMetricsJob.php`

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Ucm;
use App\Models\PerfMonHost;
use App\Models\PerfMonCounter;
use App\ApiClients\PerfMonSoap;
use Exception;
use Illuminate\Support\Facades\Log;

class CollectPerfMonMetricsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 120;
    public $tries = 3;
    public $backoff = 60;

    protected Ucm $ucm;
    protected PerfMonHost $host;

    public function __construct(Ucm $ucm, PerfMonHost $host)
    {
        $this->ucm = $ucm;
        $this->host = $host;
    }

    public function handle()
    {
        Log::channel('perfmon')->info('Starting PerfMon collection', [
            'ucm' => $this->ucm->name,
            'host' => $this->host->hostname
        ]);

        try {
            // Get enabled counters for this UCM
            $counters = PerfMonCounter::forUcm($this->ucm->id)
                ->enabled()
                ->get();

            if ($counters->isEmpty()) {
                Log::channel('perfmon')->warning('No enabled counters found', [
                    'ucm' => $this->ucm->name
                ]);
                return;
            }

            // Initialize SOAP client
            $client = new PerfMonSoap($this->ucm);

            // Collect and store metrics
            $results = $client->collectAndStoreMetrics($counters, $this->host->hostname);

            // Update host last collection time
            $this->host->touchLastCollection();
            $this->host->status = $results['success'] ? 'active' : 'error';
            $this->host->save();

            // Check thresholds and create alerts if needed
            $this->checkThresholds($counters);

            Log::channel('perfmon')->info('PerfMon collection completed', [
                'ucm' => $this->ucm->name,
                'host' => $this->host->hostname,
                'metrics_collected' => $results['metrics_collected'],
                'errors' => $results['errors']
            ]);

        } catch (Exception $e) {
            Log::channel('perfmon')->error('PerfMon collection failed', [
                'ucm' => $this->ucm->name,
                'host' => $this->host->hostname,
                'error' => $e->getMessage()
            ]);

            $this->host->status = 'error';
            $this->host->save();

            throw $e;
        }
    }

    protected function checkThresholds($counters)
    {
        foreach ($counters as $counter) {
            if (!$counter->threshold_warning && !$counter->threshold_critical) {
                continue;
            }

            // Get latest metric value
            $latestMetric = \App\Models\PerfMonMetric::where('ucm_id', $this->ucm->id)
                ->where('host', $this->host->hostname)
                ->where('object', $counter->object)
                ->where('counter', $counter->counter)
                ->orderBy('timestamp', 'desc')
                ->first();

            if (!$latestMetric) {
                continue;
            }

            $status = $counter->checkThresholds($latestMetric->value);

            if ($status !== 'normal') {
                Log::channel('perfmon')->warning('Threshold exceeded', [
                    'ucm' => $this->ucm->name,
                    'host' => $this->host->hostname,
                    'counter' => $counter->name,
                    'value' => $latestMetric->value,
                    'status' => $status
                ]);
            }
        }
    }

    public function failed(Exception $exception)
    {
        Log::channel('perfmon')->error('Job failed after retries', [
            'ucm' => $this->ucm->name,
            'host' => $this->host->hostname,
            'error' => $exception->getMessage()
        ]);

        $this->host->status = 'failed';
        $this->host->save();
    }
}
```

### 3. Create RISPort Collection Job

**File:** `app/Jobs/CollectRisportDataJob.php`

```php
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Ucm;
use App\ApiClients\RisPortSoap;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class CollectRisportDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 180;
    public $tries = 3;
    public $backoff = 120;

    protected Ucm $ucm;
    protected array $phoneNames;
    protected ?string $stateInfo;

    public function __construct(Ucm $ucm, array $phoneNames, ?string $stateInfo = null)
    {
        $this->ucm = $ucm;
        $this->phoneNames = $phoneNames;
        $this->stateInfo = $stateInfo;
    }

    public function handle()
    {
        Log::channel('risport')->info('Starting RISPort collection', [
            'ucm' => $this->ucm->name,
            'phone_count' => count($this->phoneNames)
        ]);

        try {
            // Get cached StateInfo if available
            $cacheKey = "risport_state_{$this->ucm->id}";
            if (!$this->stateInfo) {
                $this->stateInfo = Cache::get($cacheKey);
            }

            // Initialize SOAP client
            $client = new RisPortSoap($this->ucm);

            // Collect and store device data
            $results = $client->collectAndStoreDeviceData($this->phoneNames, $this->stateInfo);

            // Cache StateInfo for next query
            if ($results['state_info']) {
                Cache::put($cacheKey, $results['state_info'], now()->addMinutes(30));
            }

            Log::channel('risport')->info('RISPort collection completed', [
                'ucm' => $this->ucm->name,
                'devices_processed' => $results['devices_processed'],
                'registered' => $results['devices_registered'],
                'unregistered' => $results['devices_unregistered'],
                'errors' => $results['errors']
            ]);

        } catch (\SoapFault $e) {
            // Check for throttling
            if (str_contains($e->getMessage(), 'Rate exceeded') || 
                str_contains($e->getMessage(), 'Too many requests')) {
                
                Log::channel('risport')->warning('API rate limit hit, retrying later', [
                    'ucm' => $this->ucm->name
                ]);
                
                // Release job back to queue with delay
                $this->release(300); // Wait 5 minutes
                return;
            }

            Log::channel('risport')->error('RISPort collection failed', [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage(),
                'fault_code' => $e->faultcode ?? null
            ]);

            throw $e;

        } catch (Exception $e) {
            Log::channel('risport')->error('RISPort collection failed', [
                'ucm' => $this->ucm->name,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    public function failed(Exception $exception)
    {
        Log::channel('risport')->error('Job failed after retries', [
            'ucm' => $this->ucm->name,
            'phone_count' => count($this->phoneNames),
            'error' => $exception->getMessage()
        ]);
    }
}
```

### 4. Create PerfMon Controller

**File:** `app/Http/Controllers/PerfMonController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Ucm;
use App\Models\PerfMonMetric;
use App\Models\PerfMonCounter;
use App\Models\PerfMonHost;
use App\Jobs\CollectPerfMonMetricsJob;
use Carbon\Carbon;

class PerfMonController extends Controller
{
    public function index(Request $request)
    {
        $ucms = Ucm::where('active', true)->get();
        $selectedUcmId = $request->get('ucm_id', $ucms->first()?->id);
        
        $hosts = [];
        $counters = [];
        $latestMetrics = [];

        if ($selectedUcmId) {
            $hosts = PerfMonHost::forUcm($selectedUcmId)->get();
            $counters = PerfMonCounter::forUcm($selectedUcmId)->enabled()->get();
            $latestMetrics = PerfMonMetric::getDashboardMetrics($selectedUcmId);
        }

        return Inertia::render('PerfMon/Index', [
            'ucms' => $ucms,
            'selectedUcmId' => $selectedUcmId,
            'hosts' => $hosts,
            'counters' => $counters,
            'latestMetrics' => $latestMetrics
        ]);
    }

    public function metrics(Request $request)
    {
        $request->validate([
            'ucm_id' => 'required|string',
            'host' => 'required|string',
            'object' => 'required|string',
            'counter' => 'required|string',
            'instance' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date',
            'interval' => 'nullable|string'
        ]);

        $metrics = PerfMonMetric::getAggregatedMetrics(
            $request->ucm_id,
            $request->host,
            $request->object,
            $request->counter,
            $request->instance ?? '',
            Carbon::parse($request->start_time),
            Carbon::parse($request->end_time),
            $request->interval ?? '5m'
        );

        return response()->json($metrics);
    }

    public function counters(Request $request)
    {
        $request->validate([
            'ucm_id' => 'required|string'
        ]);

        $counters = PerfMonCounter::forUcm($request->ucm_id)
            ->enabled()
            ->get();

        return response()->json($counters);
    }

    public function hosts(Request $request)
    {
        $request->validate([
            'ucm_id' => 'required|string'
        ]);

        $hosts = PerfMonHost::forUcm($request->ucm_id)
            ->get()
            ->map(function($host) {
                $host->health_status = $host->getHealthStatus();
                $host->status_color = $host->getStatusColor();
                $host->system_metrics = $host->getLatestSystemMetrics();
                return $host;
            });

        return response()->json($hosts);
    }

    public function collect(Request $request)
    {
        $request->validate([
            'ucm_id' => 'required|string',
            'host_id' => 'required|string'
        ]);

        $ucm = Ucm::findOrFail($request->ucm_id);
        $host = PerfMonHost::findOrFail($request->host_id);

        CollectPerfMonMetricsJob::dispatch($ucm, $host);

        return response()->json([
            'message' => 'Collection job queued successfully'
        ]);
    }

    public function updateCounter(Request $request, $id)
    {
        $counter = PerfMonCounter::findOrFail($id);

        $validated = $request->validate([
            'enabled' => 'boolean',
            'collection_interval' => 'integer|min:60|max:3600',
            'threshold_warning' => 'nullable|numeric',
            'threshold_critical' => 'nullable|numeric',
            'instances' => 'array'
        ]);

        $counter->update($validated);

        return response()->json($counter);
    }

    public function realtime(Request $request)
    {
        $request->validate([
            'ucm_id' => 'required|string',
            'host' => 'nullable|string'
        ]);

        $metrics = PerfMonMetric::getDashboardMetrics(
            $request->ucm_id,
            $request->host
        );

        return response()->json($metrics);
    }
}
```

### 5. Create PerfMon Migration

**File:** `database/migrations/2024_01_01_000000_create_perfmon_collections.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        $db = DB::connection('mongodb')->getMongoDB();

        // Create timeseries collection for metrics
        try {
            $db->createCollection('perfmon_metrics', [
                'timeseries' => [
                    'timeField' => 'timestamp',
                    'metaField' => 'metadata',
                    'granularity' => 'seconds'
                ],
                'expireAfterSeconds' => 2592000 // 30 days
            ]);
        } catch (\Exception $e) {
            // Collection might already exist
        }

        // Create regular collections
        $collections = ['perfmon_counters', 'perfmon_hosts', 'perfmon_sessions', 'perfmon_alerts'];
        
        foreach ($collections as $collection) {
            try {
                $db->createCollection($collection);
            } catch (\Exception $e) {
                // Collection might already exist
            }
        }

        // Create indexes
        $metricsCollection = $db->selectCollection('perfmon_metrics');
        $metricsCollection->createIndex(['ucm_id' => 1, 'host' => 1, 'timestamp' => -1]);
        $metricsCollection->createIndex(['ucm_id' => 1, 'object' => 1, 'counter' => 1]);

        $countersCollection = $db->selectCollection('perfmon_counters');
        $countersCollection->createIndex(['ucm_id' => 1, 'enabled' => 1]);

        $hostsCollection = $db->selectCollection('perfmon_hosts');
        $hostsCollection->createIndex(['ucm_id' => 1]);
        $hostsCollection->createIndex(['ucm_id' => 1, 'hostname' => 1], ['unique' => true]);
    }

    public function down()
    {
        $db = DB::connection('mongodb')->getMongoDB();
        
        $collections = [
            'perfmon_metrics',
            'perfmon_counters', 
            'perfmon_hosts',
            'perfmon_sessions',
            'perfmon_alerts'
        ];

        foreach ($collections as $collection) {
            try {
                $db->dropCollection($collection);
            } catch (\Exception $e) {
                // Collection might not exist
            }
        }
    }
};
```

### 6. Create RISPort Migration

**File:** `database/migrations/2024_01_02_000000_create_risport_collection.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        $db = DB::connection('mongodb')->getMongoDB();

        // Create risport collection
        try {
            $db->createCollection('risport');
        } catch (\Exception $e) {
            // Collection might already exist
        }

        // Create indexes for efficient querying
        $collection = $db->selectCollection('risport');
        
        // Compound index for UCM and device name (unique)
        $collection->createIndex(
            ['ucm_id' => 1, 'name' => 1],
            ['unique' => true]
        );
        
        // Index for status queries
        $collection->createIndex(['ucm_id' => 1, 'status' => 1]);
        
        // Index for node queries
        $collection->createIndex(['ucm_id' => 1, 'node_name' => 1]);
        
        // Index for timestamp queries
        $collection->createIndex(['timestamp' => -1]);
        
        // Index for IP address lookups
        $collection->createIndex(['ip_address' => 1]);
    }

    public function down()
    {
        $db = DB::connection('mongodb')->getMongoDB();
        
        try {
            $db->dropCollection('risport');
        } catch (\Exception $e) {
            // Collection might not exist
        }
    }
};
```

### 7. Create React PerfMon Dashboard

**File:** `resources/js/Pages/PerfMon/Index.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Activity, Server, HardDrive, Cpu, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function PerfMonDashboard({ auth, ucms, selectedUcmId, hosts, counters, latestMetrics }) {
    const [selectedHost, setSelectedHost] = useState(hosts[0]?.hostname || '');
    const [selectedCounter, setSelectedCounter] = useState('');
    const [selectedInstance, setSelectedInstance] = useState('');
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [timeRange, setTimeRange] = useState('1h');
    const [currentMetrics, setCurrentMetrics] = useState(latestMetrics);

    // Time range options
    const timeRanges = {
        '15m': { label: 'Last 15 minutes', interval: '1m' },
        '1h': { label: 'Last hour', interval: '5m' },
        '6h': { label: 'Last 6 hours', interval: '15m' },
        '12h': { label: 'Last 12 hours', interval: '30m' },
        '24h': { label: 'Last 24 hours', interval: '1h' },
        '7d': { label: 'Last 7 days', interval: '6h' }
    };

    // Fetch chart data
    const fetchChartData = async () => {
        if (!selectedCounter || !selectedHost) return;

        setLoading(true);
        const counter = counters.find(c => c._id === selectedCounter);
        
        const endTime = new Date();
        const startTime = new Date();
        
        // Calculate start time based on range
        const [value, unit] = timeRange.match(/(\d+)([mhd])/).slice(1);
        if (unit === 'm') startTime.setMinutes(startTime.getMinutes() - parseInt(value));
        else if (unit === 'h') startTime.setHours(startTime.getHours() - parseInt(value));
        else if (unit === 'd') startTime.setDate(startTime.getDate() - parseInt(value));

        try {
            const response = await axios.get('/perfmon/metrics', {
                params: {
                    ucm_id: selectedUcmId,
                    host: selectedHost,
                    object: counter.object,
                    counter: counter.counter,
                    instance: selectedInstance || '',
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    interval: timeRanges[timeRange].interval
                }
            });

            setChartData(response.data.map(item => ({
                ...item,
                time: new Date(item.timestamp).toLocaleTimeString()
            })));
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch realtime metrics
    const fetchRealtimeMetrics = async () => {
        try {
            const response = await axios.get('/perfmon/realtime', {
                params: {
                    ucm_id: selectedUcmId,
                    host: selectedHost || null
                }
            });
            setCurrentMetrics(response.data);
        } catch (error) {
            console.error('Failed to fetch realtime metrics:', error);
        }
    };

    // Manual collection trigger
    const triggerCollection = async () => {
        const host = hosts.find(h => h.hostname === selectedHost);
        if (!host) return;

        try {
            await axios.post('/perfmon/collect', {
                ucm_id: selectedUcmId,
                host_id: host._id
            });
            alert('Collection job queued successfully');
        } catch (error) {
            console.error('Failed to trigger collection:', error);
            alert('Failed to trigger collection');
        }
    };

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchChartData();
                fetchRealtimeMetrics();
            }, 30000); // Refresh every 30 seconds
            return () => clearInterval(interval);
        }
    }, [autoRefresh, selectedCounter, selectedHost, timeRange]);

    // Fetch data on selection change
    useEffect(() => {
        fetchChartData();
    }, [selectedCounter, selectedInstance, selectedHost, timeRange]);

    // Get status color
    const getStatusColor = (value, thresholds) => {
        if (!thresholds) return 'text-green-500';
        if (value >= (thresholds.critical || 100)) return 'text-red-500';
        if (value >= (thresholds.warning || 80)) return 'text-yellow-500';
        return 'text-green-500';
    };

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Performance Monitoring" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header Controls */}
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Performance Monitoring</h2>
                        
                        <div className="flex gap-4 items-center">
                            {/* UCM Selector */}
                            <Select value={selectedUcmId} onValueChange={(value) => window.location.href = `/perfmon?ucm_id=${value}`}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select UCM" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ucms.map(ucm => (
                                        <SelectItem key={ucm._id} value={ucm._id}>
                                            {ucm.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Time Range Selector */}
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(timeRanges).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Auto Refresh Toggle */}
                            <Button
                                variant={autoRefresh ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAutoRefresh(!autoRefresh)}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                                Auto Refresh
                            </Button>

                            {/* Manual Collection */}
                            <Button onClick={triggerCollection} size="sm">
                                <Activity className="h-4 w-4 mr-2" />
                                Collect Now
                            </Button>
                        </div>
                    </div>

                    {/* Current Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {currentMetrics.slice(0, 4).map((metric, index) => (
                            <Card key={index}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {metric.counter}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {metric.value.toFixed(2)}
                                        {metric.counter.includes('%') && '%'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {metric.host} - {metric.instance || 'Total'}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Host Status */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Host Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {hosts.map(host => (
                                    <div key={host._id} className="flex items-center justify-between p-3 border rounded">
                                        <div className="flex items-center gap-2">
                                            <Server className="h-4 w-4" />
                                            <span className="font-medium">{host.hostname}</span>
                                        </div>
                                        <span className={`text-sm ${host.status === 'active' ? 'text-green-500' : 'text-gray-500'}`}>
                                            {host.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                            <div className="flex gap-4 mt-4">
                                {/* Host Selector */}
                                <Select value={selectedHost} onValueChange={setSelectedHost}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select Host" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {hosts.map(host => (
                                            <SelectItem key={host.hostname} value={host.hostname}>
                                                {host.hostname}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Counter Selector */}
                                <Select value={selectedCounter} onValueChange={setSelectedCounter}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Select Counter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {counters.map(counter => (
                                            <SelectItem key={counter._id} value={counter._id}>
                                                {counter.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Instance Selector */}
                                {selectedCounter && counters.find(c => c._id === selectedCounter)?.instances?.length > 0 && (
                                    <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Instance" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {counters.find(c => c._id === selectedCounter).instances.map(instance => (
                                                <SelectItem key={instance} value={instance}>
                                                    {instance || 'Default'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-64 flex items-center justify-center">
                                    <RefreshCw className="h-8 w-8 animate-spin" />
                                </div>
                            ) : chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="time" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Area 
                                            type="monotone" 
                                            dataKey="value" 
                                            stroke="#8884d8" 
                                            fill="#8884d8" 
                                            fillOpacity={0.6}
                                            name="Value"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="max" 
                                            stroke="#82ca9d" 
                                            fill="#82ca9d" 
                                            fillOpacity={0.3}
                                            name="Max"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-64 flex items-center justify-center text-gray-500">
                                    Select a counter to view metrics
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
```

### 8. Update Routes

**File:** `routes/web.php`

Add these routes to your existing routes file:

```php
// PerfMon Routes
Route::middleware(['auth'])->prefix('perfmon')->group(function () {
    Route::get('/', [App\Http\Controllers\PerfMonController::class, 'index'])->name('perfmon.index');
    Route::get('/metrics', [App\Http\Controllers\PerfMonController::class, 'metrics'])->name('perfmon.metrics');
    Route::get('/counters', [App\Http\Controllers\PerfMonController::class, 'counters'])->name('perfmon.counters');
    Route::get('/hosts', [App\Http\Controllers\PerfMonController::class, 'hosts'])->name('perfmon.hosts');
    Route::post('/collect', [App\Http\Controllers\PerfMonController::class, 'collect'])->name('perfmon.collect');
    Route::put('/counter/{id}', [App\Http\Controllers\PerfMonController::class, 'updateCounter'])->name('perfmon.counter.update');
    Route::get('/realtime', [App\Http\Controllers\PerfMonController::class, 'realtime'])->name('perfmon.realtime');
});
```

### 9. Update Kernel for Scheduling

**File:** `app/Console/Kernel.php`

Add these scheduled tasks to the `schedule` method:

```php
protected function schedule(Schedule $schedule)
{
    // ... existing schedules ...

    // PerfMon collection every 5 minutes
    $schedule->command('perfmon:collect --all')
        ->everyFiveMinutes()
        ->withoutOverlapping()
        ->runInBackground();

    // RISPort collection every 15 minutes
    $schedule->command('risport:collect --all')
        ->everyFifteenMinutes()
        ->withoutOverlapping()
        ->runInBackground();
}
```

### 10. Update Logging Configuration

**File:** `config/logging.php`

Add these channels to the `channels` array:

```php
'perfmon' => [
    'driver' => 'daily',
    'path' => storage_path('logs/perfmon.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 14,
],

'risport' => [
    'driver' => 'daily',
    'path' => storage_path('logs/risport.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 14,
],
```

## 📦 Installation Steps

1. **Install NPM dependencies** (for React charts):
   ```bash
   npm install recharts
   ```

2. **Run migrations**:
   ```bash
   php artisan migrate
   ```

3. **Initialize PerfMon** (replace YOUR_UCM_ID with actual ID):
   ```bash
   php artisan perfmon:collect --init --ucm=YOUR_UCM_ID
   ```

4. **Test collection**:
   ```bash
   # Test PerfMon collection
   php artisan perfmon:collect --ucm=YOUR_UCM_ID --sync

   # Test RISPort collection
   php artisan risport:collect --ucm=YOUR_UCM_ID --sync
   ```

5. **Start queue workers** (if using queued jobs):
   ```bash
   php artisan queue:work
   ```

6. **Access the dashboard**:
   Navigate to `/perfmon` in your browser

## 🎯 Next Steps

1. Create the remaining files listed above
2. Run `composer dump-autoload` to register new classes
3. Run migrations to create MongoDB collections
4. Initialize PerfMon with default counters
5. Test the integration with your UCM servers
6. Set up queue workers for background processing
7. Configure scheduled tasks in cron

The integration is now ready for testing and production use! 🚀
