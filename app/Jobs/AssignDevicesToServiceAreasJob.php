<?php

namespace App\Jobs;

use Exception;
use App\Models\Phone;
use App\Models\UcmUser;
use App\Models\ServiceArea;
use Illuminate\Bus\Batchable;
use Illuminate\Support\Facades\Log;
use App\Models\ServiceAreaDeviceLink;
use App\Models\ServiceAreaUcmUserLink;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;

class AssignDevicesToServiceAreasJob implements ShouldQueue
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
     */
    public function handle(): void
    {
        Log::info('Starting AssignDevicesToServiceAreasJob');

        // Create an empty array to store device-to-service-area mappings
        $devicesAndServiceAreas = [];

        // Get all UCM users that have service area assignments (using link table)
        $userIdsWithServiceAreas = ServiceAreaUcmUserLink::pluck('ucm_user_id')->unique();
        $ucmUsers = UcmUser::whereIn('id', $userIdsWithServiceAreas)->get();

        if ($ucmUsers->isEmpty()) {
            Log::info('No UCM users found');
            return;
        }

        Log::info("Processing {$ucmUsers->count()} UCM users for device assignments");

        foreach ($ucmUsers as $user) {
            // Get the service area IDs from the relationship (using the new link table)
            $serviceAreaIds = $user->getServiceAreas()->pluck('id')->toArray();

            if (empty($serviceAreaIds)) {
                Log::debug("User {$user->userid} has no service area assignments");
                continue;
            }

            Log::debug("User {$user->userid} is assigned to service areas: " . implode(', ', $serviceAreaIds));

            // Get all device names from the user's associated device fields
            $deviceNames = $this->extractDeviceNames($user);

            // Look up devices by name and get their IDs
            foreach ($deviceNames as $deviceName) {
                $device = $this->findDeviceByName($deviceName);

                if ($device) {
                    $deviceId = $device->id;

                    // Add or merge the service area IDs for this device
                    if (!isset($devicesAndServiceAreas[$deviceId])) {
                        $devicesAndServiceAreas[$deviceId] = [];
                    }

                    // Merge and keep unique service area IDs
                    $devicesAndServiceAreas[$deviceId] = array_unique(
                        array_merge($devicesAndServiceAreas[$deviceId], $serviceAreaIds)
                    );

                    Log::debug("Device {$deviceName} (ID: {$deviceId}) mapped to service areas: " . implode(', ', $devicesAndServiceAreas[$deviceId]));
                } else {
                    Log::debug("Device not found: {$deviceName}");
                }
            }
        }

        // Now iterate through the devicesAndServiceAreas array and sync
        $totalSyncOperations = 0;

        foreach ($devicesAndServiceAreas as $deviceId => $serviceAreaIds) {
            try {
                // Find the device using our method that returns the correct model type
                $device = null;
                $deviceTypes = [
                    Phone::class,
                    // Add other device types here as needed
                ];

                foreach ($deviceTypes as $deviceType) {
                    $device = $deviceType::find($deviceId);
                    if ($device) {
                        break;
                    }
                }

                if ($device) {
                    // Use custom sync method for each service area
                    $attached = [];
                    $detached = [];

                    // For each service area, check if this device should be in it
                                         foreach (ServiceArea::all() as $serviceArea) {
                         $deviceShouldBeInThisArea = in_array($serviceArea->id, $serviceAreaIds);
                         $currentDeviceIds = ServiceAreaDeviceLink::where('service_area_id', $serviceArea->id)
                             ->where('device_type', 'Phone')
                             ->pluck('device_id')
                             ->map(fn($id) => (string)$id)
                             ->toArray();

                         $deviceIsCurrentlyInArea = in_array((string)$device->id, $currentDeviceIds);

                         if ($deviceShouldBeInThisArea && !$deviceIsCurrentlyInArea) {
                             // Add device to this service area
                             ServiceAreaDeviceLink::create([
                                 'service_area_id' => $serviceArea->id,
                                 'device_id' => $device->id,
                                 'device_type' => 'Phone'
                             ]);
                             $attached[] = $device->id;
                         } elseif (!$deviceShouldBeInThisArea && $deviceIsCurrentlyInArea) {
                             // Remove device from this service area
                             ServiceAreaDeviceLink::where('service_area_id', $serviceArea->id)
                                 ->where('device_id', $device->id)
                                 ->where('device_type', 'Phone')
                                 ->delete();
                             $detached[] = $device->id;
                         }
                     }

                    $attachedCount = count($attached);
                    $detachedCount = count($detached);

                    if ($attachedCount > 0 || $detachedCount > 0) {
                        Log::info("Device {$device->name} sync completed - Attached: {$attachedCount}, Detached: {$detachedCount}");
                    }

                    $totalSyncOperations += $attachedCount + $detachedCount;
                } else {
                    Log::warning("Device not found for ID: {$deviceId}");
                }
            } catch (Exception $e) {
                Log::error("Error syncing device {$deviceId}", [
                    'error' => $e->getMessage(),
                    'service_area_ids' => $serviceAreaIds
                ]);
            }
        }

        Log::info("AssignDevicesToServiceAreasJob completed. Total sync operations: {$totalSyncOperations}");
    }

    /**
     * Extract device names from user's associated device fields
     */
    private function extractDeviceNames(UcmUser $user): array
    {
        $deviceNames = [];

        // Extract from associatedDevices
        if (!empty($user->associatedDevices)) {
            if (isset($user->associatedDevices['device'])) {
                // Handle the case where associatedDevices has a 'device' key
                $devices = $user->associatedDevices['device'];
                if (is_array($devices)) {
                    $deviceNames = array_merge($deviceNames, $devices);
                } elseif (is_string($devices)) {
                    $deviceNames[] = $devices;
                }
            } else {
                // Handle the case where associatedDevices is a direct array
                foreach ($user->associatedDevices as $device) {
                    if (is_array($device) && isset($device['device'])) {
                        // Ensure we extract string names, not arrays
                        $deviceValue = $device['device'];
                        if (is_array($deviceValue)) {
                            $deviceNames = array_merge($deviceNames, $deviceValue);
                        } else {
                            $deviceNames[] = $deviceValue;
                        }
                    } elseif (is_string($device)) {
                        $deviceNames[] = $device;
                    }
                }
            }
        }

        // Extract from associatedRemoteDestinationProfiles
        if (!empty($user->associatedRemoteDestinationProfiles)) {
            if (isset($user->associatedRemoteDestinationProfiles['remoteDestinationProfile'])) {
                // Handle the case where it has a 'remoteDestinationProfile' key
                $profiles = $user->associatedRemoteDestinationProfiles['remoteDestinationProfile'];
                if (is_array($profiles)) {
                    $deviceNames = array_merge($deviceNames, $profiles);
                } elseif (is_string($profiles)) {
                    $deviceNames[] = $profiles;
                }
            } else {
                // Handle the case where it's a direct array
                foreach ($user->associatedRemoteDestinationProfiles as $profile) {
                    if (is_array($profile) && isset($profile['device'])) {
                        $deviceNames[] = $profile['device'];
                    } elseif (is_string($profile)) {
                        $deviceNames[] = $profile;
                    }
                }
            }
        }

        // Extract from ctiControlledDeviceProfiles
        if (!empty($user->ctiControlledDeviceProfiles)) {
            if (isset($user->ctiControlledDeviceProfiles['profileName'])) {
                // Handle the case where it has a 'profileName' key with profile objects
                $profiles = $user->ctiControlledDeviceProfiles['profileName'];
                if (is_array($profiles)) {
                    foreach ($profiles as $profile) {
                        if (is_array($profile) && isset($profile['_'])) {
                            // Extract the device name from the '_' field
                            $deviceNames[] = $profile['_'];
                        } elseif (is_string($profile)) {
                            $deviceNames[] = $profile;
                        }
                    }
                }
            } else {
                // Handle the case where it's a direct array
                foreach ($user->ctiControlledDeviceProfiles as $profile) {
                    if (is_array($profile) && isset($profile['device'])) {
                        $deviceNames[] = $profile['device'];
                    } elseif (is_string($profile)) {
                        $deviceNames[] = $profile;
                    }
                }
            }
        }

        // Remove duplicates and empty values
        // Return only unique, non-empty device names that are strings
        return array_filter(array_unique($deviceNames), function ($name) {
            return is_string($name) && !empty($name);
        });
    }

    /**
     * Find device by name using specific device models
     */
    private function findDeviceByName(string $deviceName): ?Model
    {
        try {
            // Try to find the device in each specific device type
            $deviceTypes = [
                Phone::class,
                // Add other device types here as needed when they implement serviceAreas relationship
                // \App\Models\Gateway::class,
                // \App\Models\SoftwareConferenceBridge::class,
            ];

            foreach ($deviceTypes as $deviceType) {
                $device = $deviceType::where('name', $deviceName)->first();
                if ($device) {
                    return $device;
                }
            }

            return null;
        } catch (Exception $e) {
            Log::warning("Error finding device by name: {$deviceName}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
}
