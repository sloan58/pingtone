<?php

namespace App\Http\Controllers;

use App\Models\Phone;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PhoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $phones = Phone::with(['ucm', 'lines'])
            ->orderBy('name')
            ->paginate(20);

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
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