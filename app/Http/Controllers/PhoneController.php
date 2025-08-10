<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Phone;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\AppliesSearchFilters;

class PhoneController extends Controller
{
    use AppliesSearchFilters;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Phone::query()->with(['ucm']);

        // Normalize filters to an array of rows: [['field'=>..,'operator'=>..,'value'=>..], ...]
        $rawFilters = $request->input('filters_json')
            ? json_decode((string) $request->input('filters_json'), true)
            : $request->input('filters');
        if ($rawFilters === null) {
            $filters = [];
        } elseif (is_array($rawFilters)) {
            // Single row case: ['field'=>..,'operator'=>..,'value'=>..]
            if (isset($rawFilters['field'], $rawFilters['operator'])) {
                $filters = [
                    [
                        'field' => (string) $rawFilters['field'],
                        'operator' => (string) $rawFilters['operator'],
                        'value' => $rawFilters['value'] ?? '',
                    ],
                ];
            } else {
                // Array of rows (possibly keyed): reindex and filter only valid rows
                $filters = array_values(array_filter($rawFilters, function ($row) {
                    return is_array($row) && isset($row['field'], $row['operator']);
                }));
            }
        } else {
            $filters = [];
        }
        $logic = (string) $request->input('logic', 'and');
        $this->applyFilters($query, $filters, $logic, [
            'name', 'description', 'model', 'devicePoolName', 'device_pool_name', 'ucm_id'
        ]);

        $phones = $query->orderBy('name')->paginate(20)->appends($request->only('filters', 'logic'));

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
            'filters' => [
                'applied' => $filters,
                'logic' => strtolower($logic) === 'or' ? 'or' : 'and',
            ],
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Phone $phone)
    {
        $phone->load(['ucm', 'lines']);

        return Inertia::render('Phones/Show', [
            'phone' => $phone,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Phone $phone)
    {
        $phone->load('ucm');

        return Inertia::render('Phones/Edit', [
            'phone' => [
                'id' => (string) $phone->getKey(),
                'ucm_id' => (string) $phone->ucm_id,
                'name' => $phone->name,
                'description' => $phone->description ?? '',
                'model' => $phone->model ?? '',
                'devicePoolName' => $phone->devicePoolName ?? '',
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Phone $phone)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'model' => ['nullable', 'string', 'max:255'],
            'devicePoolName' => ['nullable', 'string', 'max:255'],
        ]);

        $phone->update($validated);

        return redirect()->route('phones.show', $phone)->with('toast', [
            'type' => 'success',
            'title' => 'Phone updated',
            'message' => 'The phone was updated successfully.',
        ]);
    }
}
