<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use App\Models\UcmNode;
use App\Models\UcmCluster;

class DashboardController extends Controller
{
    public function index()
    {
        // Get basic counts
        $totalUcms = UcmNode::count();
        $totalUsers = User::count();

        // Get UCM statistics (now based on clusters)
        $syncedToday = UcmCluster::where('last_sync_at', '>=', now()->startOfDay())->count();
        $currentlySyncing = UcmCluster::whereHas('syncHistory', function($query) {
            $query->where('status', 'syncing');
        })->count();
        $failedSyncs = UcmCluster::whereHas('syncHistory', function($query) {
            $query->where('status', 'failed')
                  ->latest('sync_start_time')
                  ->limit(1);
        })->count();

        // Get recent activity (UCM focused)
        $recentActivity = [
            [
                'id' => 1,
                'type' => 'ucm_sync_completed',
                'description' => 'UCM-Primary sync completed successfully',
                'timestamp' => now()->subMinutes(5),
                'icon' => 'server',
                'color' => 'green'
            ],
            [
                'id' => 2,
                'type' => 'ucm_added',
                'description' => 'New UCM server "Karmatek" added',
                'timestamp' => now()->subMinutes(15),
                'icon' => 'plus',
                'color' => 'blue'
            ],
            [
                'id' => 3,
                'type' => 'ucm_sync_failed',
                'description' => 'UCM-Primary sync failed - connection timeout',
                'timestamp' => now()->subMinutes(30),
                'icon' => 'alert-triangle',
                'color' => 'orange'
            ],
            [
                'id' => 4,
                'type' => 'ucm_updated',
                'description' => 'UCM-Primary configuration updated',
                'timestamp' => now()->subMinutes(45),
                'icon' => 'settings',
                'color' => 'purple'
            ]
        ];

        // Get system health data (UCM focused)
        $totalClusters = UcmCluster::count();
        $systemHealth = [
            'ucm_servers' => [
                'total' => $totalUcms,
                'total_clusters' => $totalClusters,
                'synced_today' => $syncedToday,
                'currently_syncing' => $currentlySyncing,
                'failed_syncs' => $failedSyncs,
                'health_percentage' => $totalClusters > 0 ? round((($totalClusters - $failedSyncs) / $totalClusters) * 100, 1) : 0
            ]
        ];

        // Get monthly trends (simulated data)
        $ucmsPrevious = max(0, $totalUcms - rand(1, 3));
        $usersPrevious = max(0, $totalUsers - rand(1, 2));

        $monthlyTrends = [
            'ucms' => [
                'current' => $totalUcms,
                'previous' => $ucmsPrevious,
                'change_percentage' => $ucmsPrevious > 0 ? round((($totalUcms - $ucmsPrevious) / $ucmsPrevious) * 100, 1) : 0
            ],
            'users' => [
                'current' => $totalUsers,
                'previous' => $usersPrevious,
                'change_percentage' => $usersPrevious > 0 ? round((($totalUsers - $usersPrevious) / $usersPrevious) * 100, 1) : 0
            ]
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_ucms' => $totalUcms,
                'total_clusters' => $totalClusters,
                'total_users' => $totalUsers,
                'synced_today' => $syncedToday,
                'currently_syncing' => $currentlySyncing,
                'failed_syncs' => $failedSyncs
            ],
            'recentActivity' => $recentActivity,
            'systemHealth' => $systemHealth,
            'monthlyTrends' => $monthlyTrends
        ]);
    }
}
