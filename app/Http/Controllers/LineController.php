<?php

namespace App\Http\Controllers;

use App\Models\Line;
use Inertia\Inertia;
use App\Models\Phone;
use Illuminate\Http\Request;

class LineController extends Controller
{
    /**
     * Search lines for async select component
     */
    public function search(Request $request)
    {
        $query = $request->input('query', '');
        $limit = min((int) $request->input('limit', 10), 50); // Max 50 results

        $linesQuery = Line::query();

        if (!empty($query)) {
            // Search by pattern or partition name
            $linesQuery->where(function ($q) use ($query) {
                $q->where('pattern', 'like', "%{$query}%")
                  ->orWhere('routePartitionName._', 'like', "%{$query}%");
            });
        }

        $lines = $linesQuery->limit($limit)->get();

        return response()->json([
            'options' => $lines->map(function ($line) {
                return [
                    'value' => $line->uuid,
                    'label' => $line->patternAndPartition,
                    'pattern' => $line->pattern,
                    'routePartition' => $line->routePartitionName,
                ];
            })
        ]);
    }

    /**
     * Get line details by UUID
     */
    public function show(Request $request, string $uuid)
    {
        $line = Line::where('uuid', $uuid)->first();
        
        if (!$line) {
            return response()->json(['error' => 'Line not found'], 404);
        }

        return response()->json($line->append('patternAndPartition'));
    }

}
