<?php

namespace App\Http\Controllers;

use App\Models\Ucm;
use App\Models\DevicePool;
use App\Models\PhoneModel;
use Illuminate\Http\JsonResponse;

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
}


