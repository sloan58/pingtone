<?php

namespace App\Jobs;

use Exception;
use App\Models\UcmUser;
use MongoDB\BSON\Regex;
use App\Models\ServiceArea;
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\Log;
use App\Models\ServiceAreaUcmUserLink;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class AssignUcmUsersToServiceAreasJob implements ShouldQueue
{
    use Queueable, Batchable;

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
        Log::info('Starting AssignUcmUsersToServiceAreasJob');

        // Get all service areas with defined user filters
        $serviceAreas = ServiceArea::whereNotNull('userFilter')->get();

        if ($serviceAreas->isEmpty()) {
            Log::info('No service areas with user filters found');
            return;
        }

        Log::info("Found {$serviceAreas->count()} service areas with user filters");

        // Get all UCM users to process
        $ucmUsers = UcmUser::all();

        if ($ucmUsers->isEmpty()) {
            Log::info('No UCM users found');
            return;
        }

        Log::info("Processing {$ucmUsers->count()} UCM users");

        $totalSyncCount = 0;

        // Iterate through each UCM user and find matching service areas
        foreach ($ucmUsers as $user) {
            $matchingServiceAreaIds = [];

            // Check which service areas this user matches
            foreach ($serviceAreas as $serviceArea) {
                $filters = $serviceArea->userFilter;

                if (!isset($filters['field']) || !isset($filters['regex']) ||
                    empty($filters['field']) || empty($filters['regex'])) {
                    continue;
                }

                $field = $filters['field'];
                $regex = $filters['regex'];

                // Check if user matches this service area's filter
                if ($this->userMatchesFilter($user, $field, $regex)) {
                    $matchingServiceAreaIds[] = $serviceArea->id;
                    Log::debug("User {$user->userid} matches service area: {$serviceArea->name}");
                }
            }

            // Sync the user with their matching service areas using custom method
            $attached = [];
            $detached = [];

            // For each service area, sync this specific user
            foreach (ServiceArea::all() as $serviceArea) {
                $userShouldBeInThisArea = in_array($serviceArea->id, $matchingServiceAreaIds);
                $currentUserIds = ServiceAreaUcmUserLink::where('service_area_id', $serviceArea->id)
                    ->pluck('ucm_user_id')
                    ->map(fn($id) => (string)$id)
                    ->toArray();

                $userIsCurrentlyInArea = in_array((string)$user->id, $currentUserIds);

                if ($userShouldBeInThisArea && !$userIsCurrentlyInArea) {
                    // Add user to this service area
                    ServiceAreaUcmUserLink::create([
                        'service_area_id' => $serviceArea->id,
                        'ucm_user_id' => $user->id
                    ]);
                    $attached[] = $user->id;
                } elseif (!$userShouldBeInThisArea && $userIsCurrentlyInArea) {
                    // Remove user from this service area
                    ServiceAreaUcmUserLink::where('service_area_id', $serviceArea->id)
                        ->where('ucm_user_id', $user->id)
                        ->delete();
                    $detached[] = $user->id;
                }
            }

            // Create a mock sync result for logging compatibility
            $syncResult = [
                'attached' => $attached ?? [],
                'detached' => $detached ?? [],
                'updated' => []
            ];

            $attached = count($syncResult['attached'] ?? []);
            $detached = count($syncResult['detached'] ?? []);
            $updated = count($syncResult['updated'] ?? []);

            if ($attached > 0 || $detached > 0 || $updated > 0) {
                Log::info("User {$user->userid} sync completed - Attached: {$attached}, Detached: {$detached}, Updated: {$updated}");
                $totalSyncCount += $attached + $detached + $updated;
            }
        }

        Log::info("AssignUcmUsersToServiceAreasJob completed. Total sync operations: {$totalSyncCount}");

        // Dispatch device assignment job after user assignment completes
        Log::info("Dispatching AssignDevicesToServiceAreasJob after user assignment completion");
        dispatch(new AssignDevicesToServiceAreasJob());
    }

    /**
     * Check if a user matches the given filter criteria
     */
    private function userMatchesFilter(UcmUser $user, string $field, string $pattern): bool
    {
        try {
            // Get the field value from the user
            $fieldValue = $user->{$field} ?? '';

            if (empty($fieldValue)) {
                return false;
            }

            // Try MongoDB regex first
            try {
                $mongoRegex = new Regex($this->prepareMongoRegex($pattern), 'i');
                // For individual comparison, we'll use PHP regex since we have the value
                return $this->matchesRegex($fieldValue, $pattern);
            } catch (Exception $e) {
                Log::debug("Using PHP regex fallback for user {$user->userid}", [
                    'field' => $field,
                    'pattern' => $pattern,
                    'error' => $e->getMessage()
                ]);

                return $this->matchesRegex($fieldValue, $pattern);
            }
        } catch (Exception $e) {
            Log::warning("Error checking filter match for user {$user->userid}", [
                'field' => $field,
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);

            return false;
        }
    }

    /**
     * Check if a value matches a regex pattern using PHP regex
     */
    private function matchesRegex(string $value, string $pattern): bool
    {
        try {
            // Ensure pattern has delimiters for PHP regex
            if (!preg_match('/^\/.*\/[gimx]*$/', $pattern)) {
                $pattern = '/' . addcslashes($pattern, '/') . '/i';
            }

            return preg_match($pattern, $value) === 1;
        } catch (Exception $e) {
            Log::warning("Invalid regex pattern: {$pattern}", ['error' => $e->getMessage()]);
            return false;
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
