<?php

namespace App\Http\Controllers;

use Log;
use Exception;
use App\Models\Line;
use Inertia\Inertia;
use Illuminate\Http\Request;

class LineController extends Controller
{

    /**
     * Display a listing of lines
     */
    public function index(Request $request)
    {
        $searchQuery = $request->get('search', '');

        // Get lines from database with search
        $query = Line::query();

        if ($searchQuery) {
            $query->where(function ($q) use ($searchQuery) {
                $q->where('pattern', 'like', "%{$searchQuery}%")
                    ->orWhere('description', 'like', "%{$searchQuery}%");
            });
        }

        $lines = $query->orderBy('pattern')
            ->limit(1000) // Reasonable limit for performance
            ->get()
            ->map(function ($line) {
                // Get associated devices count
                $associatedDevicesCount = $this->getAssociatedDevicesCount($line->uuid);

                return [
                    'uuid' => $line->uuid,
                    'pattern' => $line->pattern,
                    'description' => $line->description,
                    'routePartitionName' => $line->route_partition_name ? [
                        '_' => $line->route_partition_name,
                        'uuid' => $line->route_partition_uuid
                    ] : null,
                    'usage' => $line->usage ?? 'Device',
                    'shareLineAppearanceCssName' => $line->share_line_appearance_css_name ? [
                        '_' => $line->share_line_appearance_css_name,
                        'uuid' => $line->share_line_appearance_css_uuid
                    ] : null,
                    'voiceMailProfileName' => $line->voice_mail_profile_name ? [
                        '_' => $line->voice_mail_profile_name,
                        'uuid' => $line->voice_mail_profile_uuid
                    ] : null,
                    'associatedDevicesCount' => $associatedDevicesCount,
                ];
            });

        return Inertia::render('Lines/Index', [
            'lines' => $lines,
            'searchQuery' => $searchQuery,
        ]);
    }

    /**
     * Show the form for editing the specified line
     */
    public function edit(string $uuid)
    {
        // Get line from database
        $line = Line::where('uuid', $uuid)->first();

        if (!$line) {
            abort(404, 'Line not found');
        }

        return Inertia::render('Lines/Edit', [
            'line' => $line->toArray(),
            'associatedDevices' => $line->getAssociatedDevices(),
        ]);
    }

    /**
     * Update the specified line in UCM
     */
    public function update(Request $request, string $uuid)
    {
        // Get line from database to access UCM relationship
        $line = Line::where('uuid', $uuid)->first();

        if (!$line) {
            return response()->json(['message' => 'Line not found'], 404);
        }

        try {
            // Use the line's updateAndSync method which handles AXL communication
            $line->updateAndSync($request->all());

            return response()->json([
                'message' => 'Line updated successfully'
            ]);

        } catch (Exception $e) {
            Log::error('Failed to update line: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update line: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search for lines (API endpoint)
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        // Search lines in database
        $lines = Line::where(function ($q) use ($query) {
            $q->where('pattern', 'like', "%{$query}%")
                ->orWhere('description', 'like', "%{$query}%");
        })
        ->orderBy('pattern')
        ->limit(50) // Limit for performance
        ->get()
        ->map(function ($line) {
            return [
                'uuid' => $line->uuid,
                'pattern' => $line->pattern,
                'description' => $line->description,
                'routePartitionName' => $line->route_partition_name,
            ];
        });

        return response()->json($lines);
    }

}
