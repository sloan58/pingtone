<?php

namespace App\Jobs;

use Exception;
use App\Models\UcmUser;
use MongoDB\BSON\Regex;
use App\Models\ServiceArea;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class AssignServiceAreasJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     * @throws Exception
     */
    public function handle(): void
    {
        Log::info('Starting AssignServiceAreasJob');

        // Get all service areas with defined user filters
        $serviceAreas = ServiceArea::whereNotNull('userFilters')->get();

        if ($serviceAreas->isEmpty()) {
            Log::info('No service areas with user filters found');
            return;
        }

        $serviceAreaCount = $serviceAreas->count();
        Log::info("Processing {$serviceAreaCount} service areas");

        $totalSyncCount = 0;

        foreach ($serviceAreas as $serviceArea) {
            $filters = $serviceArea->userFilters;

            $field = $filters['field'];
            $regex = $filters['regex'];

            Log::info("Processing service area: {$serviceArea->name}, field: {$field}, regex: {$regex}");

            // Get matching user IDs using raw MongoDB query for performance
            $matchedUserIds = $this->getMatchingUserIds($field, $regex);

            Log::info("Found " . count($matchedUserIds) . " matching users for service area: {$serviceArea->name}");

            // Use sync to atomically attach/detach users
            $syncResult = $serviceArea->ucmUsers()->sync($matchedUserIds);

            $attached = count($syncResult['attached'] ?? []);
            $detached = count($syncResult['detached'] ?? []);
            $updated = count($syncResult['updated'] ?? []);

            Log::info("Service area {$serviceArea->name} sync completed - Attached: {$attached}, Detached: {$detached}, Updated: {$updated}");

            $totalSyncCount += $attached + $detached + $updated;
        }

        Log::info("AssignServiceAreasJob completed. Total sync operations: {$totalSyncCount}");
    }

    /**
     * Get user IDs that match the regex pattern using raw MongoDB query
     * @throws Exception
     */
    private function getMatchingUserIds(string $field, string $pattern): array
    {
        try {
            // For MongoDB Laravel, we need to use a MongoDB regex object
            $mongoRegex = new Regex($this->prepareMongoRegex($pattern), 'i');

            // Use raw MongoDB query for better performance
            $matchingUsers = UcmUser::where($field, $mongoRegex)
                ->pluck('id')
                ->toArray();

            Log::debug("MongoDB regex query for field '{$field}' with pattern '{$pattern}' found " . count($matchingUsers) . " users");

            return $matchingUsers;
        } catch (Exception $e) {
            Log::warning("Error executing MongoDB regex query, falling back to PHP regex", [
                'field' => $field,
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Prepare regex pattern for MongoDB
     */
    private function prepareMongoRegex(string $pattern): string
    {
        // Remove delimiters if they exist (MongoDB doesn't use them)
        if (preg_match('/^\/(.*)\/([gimx]*)$/', $pattern, $matches)) {
            return $matches[1];
        }

        return $pattern;
    }
}
