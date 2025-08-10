<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Phone;
use Illuminate\Http\Request;
// use App\Http\Controllers\Concerns\AppliesSearchFilters;

class PhoneController extends Controller
{
    // use AppliesSearchFilters;
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Phone::query()->with(['ucm']);

        // TanStack Table server-driven paging/sorting (filters to be added later if needed)
        $sort = (string) $request->input('sort', 'name:asc');
        [$sortField, $sortDir] = array_pad(explode(':', $sort, 2), 2, 'asc');
        $sortField = in_array($sortField, ['name','description','model','devicePoolName']) ? $sortField : 'name';
        $sortDir = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        $perPage = (int) $request->input('perPage', 20);
        if ($perPage < 5 || $perPage > 100) { $perPage = 20; }

        $phones = $query->orderBy($sortField, $sortDir)
            ->paginate($perPage)
            ->appends($request->only('page','perPage','sort'));

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
            'tableState' => [
                'sort' => $sortField.':'.$sortDir,
                'perPage' => $perPage,
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
