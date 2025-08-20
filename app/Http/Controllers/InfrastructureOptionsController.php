<?php

namespace App\Http\Controllers;

use Log;
use Exception;
use App\Models\Phone;
use App\Models\UcmUser;
use App\Models\Location;
use App\Models\AarGroup;
use App\Models\DevicePool;
use App\Models\PhoneModel;
use App\Models\UserLocale;
use App\Models\SipProfile;
use App\Models\UcmCluster;
use App\Models\GeoLocation;
use Illuminate\Http\Request;
use App\Models\SipDialRules;
use App\Models\PresenceGroup;
use App\Models\DeviceProfile;
use App\Models\MohAudioSource;
use App\Models\RoutePartition;
use App\Models\CallPickupGroup;
use App\Models\VoicemailProfile;
use App\Models\CommonPhoneConfig;
use Illuminate\Http\JsonResponse;
use App\Models\CommonDeviceConfig;
use App\Models\CallingSearchSpace;
use App\Models\PhoneButtonTemplate;
use App\Models\PhoneSecurityProfile;
use App\Models\MediaResourceGroupList;
use App\Models\ExternalCallControlProfile;

class InfrastructureOptionsController extends Controller
{
    public function devicePools(UcmCluster $ucmCluster): JsonResponse
    {
        $options = DevicePool::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function externalCallControlProfiles(UcmCluster $ucmCluster): JsonResponse
    {
        $options = ExternalCallControlProfile::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneModels(UcmCluster $ucmCluster): JsonResponse
    {
        $options = PhoneModel::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phones(UcmCluster $ucmCluster): JsonResponse
    {
        $options = Phone::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function commonDeviceConfigs(UcmCluster $ucmCluster): JsonResponse
    {
        $options = CommonDeviceConfig::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneButtonTemplates(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        $query = PhoneButtonTemplate::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey());

        // Filter by protocol if provided
        if ($request->has('protocol') && $request->protocol) {
            $query->where('protocol', $request->protocol);
        }

        // Filter by model if provided
        if ($request->has('model') && $request->model) {
            $query->where('model', $request->model);
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function commonPhoneConfigs(UcmCluster $ucmCluster): JsonResponse
    {
        $options = CommonPhoneConfig::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function callingSearchSpaces(UcmCluster $ucmCluster): JsonResponse
    {
        $options = CallingSearchSpace::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function locations(UcmCluster $ucmCluster): JsonResponse
    {
        $options = Location::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function mediaResourceGroupLists(UcmCluster $ucmCluster): JsonResponse
    {
        $options = MediaResourceGroupList::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function mohAudioSources(UcmCluster $ucmCluster): JsonResponse
    {
        $options = MohAudioSource::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function aarGroups(UcmCluster $ucmCluster): JsonResponse
    {
        $options = AarGroup::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function userLocales(UcmCluster $ucmCluster): JsonResponse
    {
        $options = UserLocale::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function ucmUsers(UcmCluster $ucmCluster): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'userid'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'userid' => $row->userid ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function mobilityUsers(UcmCluster $ucmCluster): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->where('enableMobility', 'true')
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'userid'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'userid' => $row->userid ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function geoLocations(UcmCluster $ucmCluster): JsonResponse
    {
        $options = GeoLocation::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function presenceGroups(UcmCluster $ucmCluster): JsonResponse
    {
        $options = PresenceGroup::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function sipDialRules(UcmCluster $ucmCluster): JsonResponse
    {
        $options = SipDialRules::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneSecurityProfiles(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        $query = PhoneSecurityProfile::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey());

        // Filter by phone type if provided
        if ($request->has('phoneType') && $request->phoneType) {
            $query->where('phoneType', $request->phoneType);
        } else {
            // If no phone type provided, still return profiles but log for debugging
            Log::info('Phone security profiles requested without phoneType filter', [
                'ucm_cluster_id' => $ucmCluster->getKey(),
                'phoneType' => $request->phoneType ?? 'not provided'
            ]);
        }

        $options = $query->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function sipProfiles(UcmCluster $ucmCluster): JsonResponse
    {
        $options = SipProfile::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function deviceProfiles(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        $query = DeviceProfile::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey());

        // Filter by phone model if provided
        if ($request->has('model') && $request->model) {
            $query->where('model', $request->model);
        }

        $options = $query->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'model'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'model' => $row->model ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function voicemailProfiles(UcmCluster $ucmCluster): JsonResponse
    {
        $options = VoicemailProfile::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function callPickupGroups(UcmCluster $ucmCluster): JsonResponse
    {
        $options = CallPickupGroup::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function extensionMobilityDynamic(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        $phoneId = $request->get('phoneId');

        if (!$phoneId) {
            return response()->json(['error' => 'Phone ID is required'], 400);
        }

        try {
            // Get the phone to retrieve its UUID
            $phone = Phone::where('_id', $phoneId)
                ->where('ucm_cluster_id', $ucmCluster->getKey())
                ->first();

            if (!$phone) {
                return response()->json(['error' => 'Phone not found'], 404);
            }

            $axl = $ucmCluster->axlApi();
            $data = $axl->getExtensionMobilityDynamicForPhone($phone->uuid);

            return response()->json($data);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function routePartitions(UcmCluster $ucmCluster): JsonResponse
    {
        $options = RoutePartition::query()
            ->where('ucm_cluster_id', $ucmCluster->getKey())
            ->where('partitionUsage', 'General')
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn($row) => [
                'id' => (string)$row->id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }
}


