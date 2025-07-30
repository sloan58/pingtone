<?php

namespace App\Http\Controllers;

use App\Models\Ucm;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class UcmController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $ucms = Ucm::orderBy('name')->get();

        return Inertia::render('Ucm/Index', [
            'ucms' => $ucms,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Ucm/Create', [
            'apiVersions' => Ucm::getApiVersions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        // Debug: Log the incoming request data
        Log::info('UCM store request data', $request->all());
        
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ucms',
                'hostname' => 'required|string|max:255|unique:ucms',
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'schema_version' => 'required|string|max:50',
            ]);
            
            // Debug: Log the validated data
            Log::info('UCM store validated data', $validated);

            $ucm = Ucm::create($validated);

            return redirect()->route('ucm.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'UCM Server Created',
                    'message' => 'UCM server created successfully.'
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to create UCM server', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Create UCM Server',
                    'message' => 'An error occurred while creating the UCM server. Please try again.'
                ]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Ucm $ucm): Response
    {
        return Inertia::render('Ucm/Show', [
            'ucm' => $ucm,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Ucm $ucm): Response
    {
        return Inertia::render('Ucm/Edit', [
            'ucm' => $ucm,
            'apiVersions' => Ucm::getApiVersions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Ucm $ucm): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ucms,name,' . $ucm->id,
                'hostname' => 'required|string|max:255|unique:ucms,hostname,' . $ucm->id,
                'username' => 'required|string|max:255',
                'password' => 'nullable|string',
                'schema_version' => 'required|string|max:50',
            ]);

            // Only update password if provided
            if (empty($validated['password'])) {
                unset($validated['password']);
            }

            $ucm->update($validated);

            return redirect()->route('ucm.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'UCM Server Updated',
                    'message' => 'UCM server updated successfully.'
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to update UCM server', [
                'ucm_id' => $ucm->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Update UCM Server',
                    'message' => 'An error occurred while updating the UCM server. Please try again.'
                ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ucm $ucm): RedirectResponse
    {
        try {
            $ucm->delete();

            return redirect()->route('ucm.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'UCM Server Deleted',
                    'message' => 'UCM server deleted successfully.'
                ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete UCM server', [
                'ucm_id' => $ucm->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Delete UCM Server',
                    'message' => 'An error occurred while deleting the UCM server. Please try again.'
                ]);
        }
    }
} 