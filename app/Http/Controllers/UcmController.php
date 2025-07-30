<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Ucm;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\RedirectResponse;

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

            // Create the UCM record first
            $ucm = Ucm::create($validated);

            // Test API connection and get actual version
            $apiVersion = null;

            try {
                Log::info("Testing API connection for UCM: {$ucm->name}");
                $apiVersion = $ucm->updateVersionFromApi();

                if ($apiVersion) {
                    Log::info("Successfully detected version: {$apiVersion}");
                    $message = "UCM server created successfully. API version detected: {$apiVersion}";
                    $toastType = 'success';
                    $toastTitle = 'UCM Server Created Successfully';
                } else {
                    Log::warning("API connection successful but no version detected");
                    $message = "UCM server created successfully. API connection established but version detection failed.";
                    $toastType = 'warning';
                    $toastTitle = 'UCM Server Created with Warning';
                }
            } catch (Exception $apiException) {
                Log::error('API connection failed during UCM creation', [
                    'ucm_id' => $ucm->id,
                    'error' => $apiException->getMessage(),
                ]);

                $message = "UCM server created but API connection failed. Please check credentials and network connectivity.";
                $toastType = 'error';
                $toastTitle = 'UCM Server Created with Connection Error';
            }

            return redirect()->route('ucm.index')
                ->with('toast', [
                    'type' => $toastType,
                    'title' => $toastTitle,
                    'message' => $message
                ]);
        } catch (Exception $e) {
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
        $syncHistory = $ucm->syncHistory()
            ->orderBy('sync_start_time', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Ucm/Show', [
            'ucm' => $ucm,
            'syncHistory' => $syncHistory,
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
        } catch (Exception $e) {
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
     * Test the API connection for a UCM server.
     */
    public function testConnection(Ucm $ucm): RedirectResponse
    {
        try {
            Log::info("Testing API connection for UCM: {$ucm->name}");

            $apiVersion = $ucm->updateVersionFromApi();

            Log::info("Successfully detected version: {$apiVersion}");

            $message = "API connection successful. Version detected: {$apiVersion}";
            $toastType = 'success';
            $toastTitle = 'Connection Test Successful';

            return redirect()->back()
                ->with('toast', [
                    'type' => $toastType,
                    'title' => $toastTitle,
                    'message' => $message
                ]);
        } catch (Exception $e) {
            Log::error('API connection test failed', [
                'ucm_id' => $ucm->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Connection Test Failed',
                    'message' => 'API connection failed. Please check credentials and network connectivity.'
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
        } catch (Exception $e) {
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
