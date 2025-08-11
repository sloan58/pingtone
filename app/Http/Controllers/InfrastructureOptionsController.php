<?php

namespace App\Http\Controllers;

use App\Models\Ucm;
use App\Models\UcmUser;
use App\Models\Location;
use App\Models\AarGroup;
use App\Models\DevicePool;
use App\Models\PhoneModel;
use App\Models\UserLocale;
use Illuminate\Http\Request;
use App\Models\MohAudioSource;
use App\Models\CommonPhoneConfig;
use Illuminate\Http\JsonResponse;
use App\Models\CommonDeviceConfig;
use App\Models\CallingSearchSpace;
use App\Models\PhoneButtonTemplate;
use App\Models\MediaResourceGroupList;

class InfrastructureOptionsController extends Controller
{
    public function devicePools(Ucm $ucm): JsonResponse
    {
        $options = DevicePool::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function phoneModels(Ucm $ucm): JsonResponse
    {
        $options = PhoneModel::query()
            ->where('ucm_id', $ucm->getKey())
            ->orderBy('name')
            ->get(['_id', 'name'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'name' => $row->name ?? ($row['name'] ?? null),
            ])
            ->values();

        return response()->json($options);
    }

    public function commonDeviceConfigs(Ucm $ucm): JsonResponse
    {
        $options = CommonDeviceConfig::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function phoneButtonTemplates(Ucm $ucm, Request $request): JsonResponse
    {
        $query = PhoneButtonTemplate::query()
            ->where('ucm_id', $ucm->getKey());

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

    public function commonPhoneConfigs(Ucm $ucm): JsonResponse
    {
        $options = CommonPhoneConfig::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function callingSearchSpaces(Ucm $ucm): JsonResponse
    {
        $options = CallingSearchSpace::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function locations(Ucm $ucm): JsonResponse
    {
        $options = Location::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function mediaResourceGroupLists(Ucm $ucm): JsonResponse
    {
        $options = MediaResourceGroupList::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function mohAudioSources(Ucm $ucm): JsonResponse
    {
        $options = MohAudioSource::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function aarGroups(Ucm $ucm): JsonResponse
    {
        $options = AarGroup::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function userLocales(Ucm $ucm): JsonResponse
    {
        $options = UserLocale::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function ucmUsers(Ucm $ucm): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_id', $ucm->getKey())
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

    public function mobilityUsers(Ucm $ucm): JsonResponse
    {
        $options = UcmUser::query()
            ->where('ucm_id', $ucm->getKey())
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
}


