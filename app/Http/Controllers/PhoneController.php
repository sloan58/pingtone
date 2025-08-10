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

        $filters = (array) $request->input('filters', []);
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
