<?php

namespace App\Http\Controllers;

use Log;
use Exception;
use App\Models\Phone;
use App\Models\UcmNode;
use App\Models\UcmUser;
use App\Models\Location;
use App\Models\AarGroup;
use App\Models\DevicePool;
use App\Models\PhoneModel;
use App\Models\UserLocale;
use App\Models\SipProfile;
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
    public function devicePools(UcmNode $ucm): JsonResponse
    {
        $options = DevicePool::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function externalCallControlProfiles(UcmNode $ucm): JsonResponse
    {
        $options = ExternalCallControlProfile::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneModels(UcmNode $ucm): JsonResponse
    {
        $options = PhoneModel::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phones(UcmNode $ucm): JsonResponse
    {
        $options = Phone::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function commonDeviceConfigs(UcmNode $ucm): JsonResponse
    {
        $options = CommonDeviceConfig::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneButtonTemplates(UcmNode $ucm, Request $request): JsonResponse
    {
        $query = PhoneButtonTemplate::query()
            ->where('ucm_cluster_id', $ucm->getKey());

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

    public function commonPhoneConfigs(UcmNode $ucm): JsonResponse
    {
        $options = CommonPhoneConfig::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function callingSearchSpaces(UcmNode $ucm): JsonResponse
    {
        $options = CallingSearchSpace::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function locations(UcmNode $ucm): JsonResponse
    {
        $options = Location::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function mediaResourceGroupLists(UcmNode $ucm): JsonResponse
    {
        $options = MediaResourceGroupList::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function mohAudioSources(UcmNode $ucm): JsonResponse
    {
        $options = MohAudioSource::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function aarGroups(UcmNode $ucm): JsonResponse
    {
        $options = AarGroup::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function userLocales(UcmNode $ucm): JsonResponse
    {
        $options = UserLocale::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function ucmUsers(UcmNode $ucm): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'userid'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'userid' => $row->userid ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function mobilityUsers(UcmNode $ucm): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->where('enableMobility', 'true')
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'userid'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'userid' => $row->userid ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function geoLocations(UcmNode $ucm): JsonResponse
    {
        $options = GeoLocation::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function presenceGroups(UcmNode $ucm): JsonResponse
    {
        $options = PresenceGroup::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function sipDialRules(UcmNode $ucm): JsonResponse
    {
        $options = SipDialRules::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function phoneSecurityProfiles(UcmNode $ucm, Request $request): JsonResponse
    {
        $query = PhoneSecurityProfile::query()
            ->where('ucm_cluster_id', $ucm->getKey());

        // Filter by phone type if provided
        if ($request->has('phoneType') && $request->phoneType) {
            $query->where('phoneType', $request->phoneType);
        } else {
            // If no phone type provided, still return profiles but log for debugging
            Log::info('Phone security profiles requested without phoneType filter', [
                'ucm_cluster_id' => $ucm->getKey(),
                'phoneType' => $request->phoneType ?? 'not provided'
            ]);
        }

        $options = $query->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function sipProfiles(UcmNode $ucm): JsonResponse
    {
        $options = SipProfile::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function deviceProfiles(UcmNode $ucm, Request $request): JsonResponse
    {
        $query = DeviceProfile::query()
            ->where('ucm_cluster_id', $ucm->getKey());

        // Filter by phone model if provided
        if ($request->has('model') && $request->model) {
            $query->where('model', $request->model);
        }

        $options = $query->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'model'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'model' => $row->model ?? null,
            ])
            ->values();

        return response()->json($options);
    }

    public function voicemailProfiles(UcmNode $ucm): JsonResponse
    {
        $options = VoicemailProfile::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function callPickupGroups(UcmNode $ucm): JsonResponse
    {
        $options = CallPickupGroup::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function extensionMobilityDynamic(UcmNode $ucm, Request $request): JsonResponse
    {
        $phoneId = $request->get('phoneId');

        if (!$phoneId) {
            return response()->json(['error' => 'Phone ID is required'], 400);
        }

        try {
            // Get the phone to retrieve its UUID
            $phone = Phone::where('_id', $phoneId)
                ->where('ucm_cluster_id', $ucm->getKey())
                ->first();

            if (!$phone) {
                return response()->json(['error' => 'Phone not found'], 404);
            }

            $axl = $ucm->axlApi();
            $data = $axl->getExtensionMobilityDynamicForPhone($phone->uuid);

            return response()->json($data);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function routePartitions(UcmNode $ucm): JsonResponse
    {
        $options = RoutePartition::query()
            ->where('ucm_cluster_id', $ucm->getKey())
            ->where('partitionUsage', 'General')
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }
}


