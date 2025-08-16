<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use App\Jobs\AssignDevicesToServiceAreasJob;
use App\Jobs\AssignUcmUsersToServiceAreasJob;

class ServiceArea extends Model
{
    protected $guarded = [];

    protected $casts = [
        'userFilter' => 'array',
    ];

    /**
     * Get UCM users using custom link table query
     * Use this method for actual data retrieval
     */
    public function ucmUsers()
    {
        $userIds = ServiceAreaUcmUserLink::where('service_area_id', $this->id)
            ->pluck('ucm_user_id');

        return UcmUser::whereIn('id', $userIds);
    }

    /**
     * Custom sync method for UCM users using link collection
     */
    public function syncUcmUsers(array $userIds): array
    {
        // Get current linked user IDs
        $currentUserIds = ServiceAreaUcmUserLink::where('service_area_id', $this->id)
            ->pluck('ucm_user_id')
            ->toArray();

        // Convert ObjectIds to strings for comparison
        $currentUserIds = array_map(fn($id) => (string)$id, $currentUserIds);
        $userIds = array_map(fn($id) => (string)$id, $userIds);

        // Determine what to attach and detach
        $toAttach = array_diff($userIds, $currentUserIds);
        $toDetach = array_diff($currentUserIds, $userIds);

        $attached = [];
        $detached = [];

        // Attach new relationships
        foreach ($toAttach as $userId) {
            ServiceAreaUcmUserLink::create([
                'service_area_id' => $this->id,
                'ucm_user_id' => $userId
            ]);
            $attached[] = $userId;
        }

        // Detach old relationships
        if (!empty($toDetach)) {
            ServiceAreaUcmUserLink::where('service_area_id', $this->id)
                ->whereIn('ucm_user_id', $toDetach)
                ->delete();
            $detached = $toDetach;
        }

        return [
            'attached' => $attached,
            'detached' => $detached,
        ];
    }

    /**
     * Get phones using custom link table query
     * Use this method for actual data retrieval
     */
    public function phones()
    {
        $phoneIds = ServiceAreaDeviceLink::where('service_area_id', $this->id)
            ->where('device_type', 'Phone')
            ->pluck('device_id');

        return Phone::whereIn('id', $phoneIds);
    }

    /**
     * Get all devices of any type for this service area
     */
    public function devices()
    {
        return ServiceAreaDeviceLink::where('service_area_id', $this->id);
    }

    /**
     * Get devices of a specific type for this service area
     */
    public function devicesByType(string $deviceType)
    {
        $deviceIds = ServiceAreaDeviceLink::where('service_area_id', $this->id)
            ->where('device_type', $deviceType)
            ->pluck('device_id');

        return match($deviceType) {
            'Phone' => Phone::whereIn('id', $deviceIds),
            'DeviceProfile' => DeviceProfile::whereIn('id', $deviceIds),
            'RemoteDestinationProfile' => RemoteDestinationProfile::whereIn('id', $deviceIds),
            default => collect([])
        };
    }

    /**
     * Custom sync method for phones using device link collection
     */
    public function syncPhones(array $phoneIds): array
    {
        return $this->syncDevices($phoneIds, 'Phone');
    }

    /**
     * Generic sync method for any device type using device link collection
     */
    public function syncDevices(array $deviceIds, string $deviceType): array
    {
        // Get current linked device IDs for this type
        $currentDeviceIds = ServiceAreaDeviceLink::where('service_area_id', $this->id)
            ->where('device_type', $deviceType)
            ->pluck('device_id')
            ->toArray();

        // Convert to strings for comparison
        $currentDeviceIds = array_map(fn($id) => (string)$id, $currentDeviceIds);
        $deviceIds = array_map(fn($id) => (string)$id, $deviceIds);

        // Determine what to attach and detach
        $toAttach = array_diff($deviceIds, $currentDeviceIds);
        $toDetach = array_diff($currentDeviceIds, $deviceIds);

        $attached = [];
        $detached = [];

        // Attach new relationships
        foreach ($toAttach as $deviceId) {
            ServiceAreaDeviceLink::create([
                'service_area_id' => $this->id,
                'device_id' => $deviceId,
                'device_type' => $deviceType
            ]);
            $attached[] = $deviceId;
        }

        // Detach old relationships
        if (!empty($toDetach)) {
            ServiceAreaDeviceLink::where('service_area_id', $this->id)
                ->where('device_type', $deviceType)
                ->whereIn('device_id', $toDetach)
                ->delete();
            $detached = $toDetach;
        }

        return [
            'attached' => $attached,
            'detached' => $detached,
        ];
    }

    /**
     * Manually trigger assignment of users to service areas
     */
    public static function triggerUserAssignment(): void
    {
        dispatch(new AssignUcmUsersToServiceAreasJob());
    }

    /**
     * Manually trigger assignment of devices to service areas
     */
    public static function triggerDeviceAssignment(): void
    {
        dispatch(new AssignDevicesToServiceAreasJob());
    }

    /**
     * Trigger both user and device assignments with proper sequencing
     * Device assignment is triggered automatically after user assignment completes
     */
    public static function triggerAllAssignments(): void
    {
        // Only dispatch user assignment - it will automatically trigger device assignment when complete
        dispatch(new AssignUcmUsersToServiceAreasJob());
    }
}
