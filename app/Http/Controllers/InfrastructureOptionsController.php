<?php

namespace App\Http\Controllers;

use App\Models\Ucm;
use App\Models\DevicePool;
use App\Models\PhoneModel;
use Illuminate\Http\Request;
use App\Models\CommonPhoneConfig;
use Illuminate\Http\JsonResponse;
use App\Models\CommonDeviceConfig;
use App\Models\PhoneButtonTemplate;

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

        $options = $query->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'model', 'protocol'])
            ->map(fn ($row) => [
                'id' => (string) $row->_id,
                'uuid' => $row->uuid ?? null,
                'name' => $row->name ?? ($row['name'] ?? null),
                'model' => $row->model ?? null,
                'protocol' => $row->protocol ?? null,
            ])
            ->values();

        return response()->json($options);
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
}


