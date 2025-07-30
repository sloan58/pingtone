<?php

namespace App\Http\Controllers;

use App\Models\Phone;
use App\Models\Ucm;
use App\Models\Line;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Get basic counts
        $totalPhones = Phone::count();
        $totalUcms = Ucm::count();
        $totalLines = Line::count();
        $totalUsers = User::count();

        // Get phone statistics
        $registeredPhones = Phone::where('status', 'Registered')->count();
        $unregisteredPhones = Phone::where('status', 'Unregistered')->count();
        $phoneModels = Phone::selectRaw('model, COUNT(*) as count')
            ->groupBy('model')
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get();

        // Get UCM statistics
        $activeUcms = Ucm::where('is_active', true)->count();
        $inactiveUcms = Ucm::where('is_active', false)->count();

        // Get recent activity (simulated for now)
        $recentActivity = [
            [
                'id' => 1,
                'type' => 'phone_registered',
                'description' => 'Phone SEP001122334455 registered to UCM-Primary',
                'timestamp' => now()->subMinutes(5),
                'icon' => 'phone',
                'color' => 'green'
            ],
            [
                'id' => 2,
                'type' => 'line_assigned',
                'description' => 'Line 1001 assigned to Phone SEP001122334455',
                'timestamp' => now()->subMinutes(15),
                'icon' => 'link',
                'color' => 'blue'
            ],
            [
                'id' => 3,
                'type' => 'ucm_updated',
                'description' => 'UCM-Primary configuration updated',
                'timestamp' => now()->subMinutes(30),
                'icon' => 'server',
                'color' => 'orange'
            ],
            [
                'id' => 4,
                'type' => 'phone_unregistered',
                'description' => 'Phone SEP009988776655 unregistered',
                'timestamp' => now()->subMinutes(45),
                'icon' => 'phone-off',
                'color' => 'red'
            ]
        ];

        // Get system health data
        $systemHealth = [
            'ucm_servers' => [
                'total' => $totalUcms,
                'active' => $activeUcms,
                'inactive' => $inactiveUcms,
                'health_percentage' => $totalUcms > 0 ? round(($activeUcms / $totalUcms) * 100, 1) : 0
            ],
            'phones' => [
                'total' => $totalPhones,
                'registered' => $registeredPhones,
                'unregistered' => $unregisteredPhones,
                'health_percentage' => $totalPhones > 0 ? round(($registeredPhones / $totalPhones) * 100, 1) : 0
            ],
            'lines' => [
                'total' => $totalLines,
                'assigned' => Line::whereHas('phones')->count(),
                'unassigned' => Line::whereDoesntHave('phones')->count(),
                'health_percentage' => $totalLines > 0 ? round((Line::whereHas('phones')->count() / $totalLines) * 100, 1) : 0
            ]
        ];

        // Get monthly trends (simulated data)
        $phonesPrevious = max(0, $totalPhones - rand(5, 15));
        $linesPrevious = max(0, $totalLines - rand(3, 10));
        $usersPrevious = max(0, $totalUsers - rand(2, 8));
        
        $monthlyTrends = [
            'phones' => [
                'current' => $totalPhones,
                'previous' => $phonesPrevious,
                'change_percentage' => $phonesPrevious > 0 ? round((($totalPhones - $phonesPrevious) / $phonesPrevious) * 100, 1) : 0
            ],
            'lines' => [
                'current' => $totalLines,
                'previous' => $linesPrevious,
                'change_percentage' => $linesPrevious > 0 ? round((($totalLines - $linesPrevious) / $linesPrevious) * 100, 1) : 0
            ],
            'users' => [
                'current' => $totalUsers,
                'previous' => $usersPrevious,
                'change_percentage' => $usersPrevious > 0 ? round((($totalUsers - $usersPrevious) / $usersPrevious) * 100, 1) : 0
            ]
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_phones' => $totalPhones,
                'total_ucms' => $totalUcms,
                'total_lines' => $totalLines,
                'total_users' => $totalUsers,
                'registered_phones' => $registeredPhones,
                'unregistered_phones' => $unregisteredPhones,
                'active_ucms' => $activeUcms,
                'inactive_ucms' => $inactiveUcms
            ],
            'phoneModels' => $phoneModels,
            'recentActivity' => $recentActivity,
            'systemHealth' => $systemHealth,
            'monthlyTrends' => $monthlyTrends
        ]);
    }
} 