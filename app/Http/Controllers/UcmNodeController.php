<?php

namespace App\Http\Controllers;

use App\Models\UcmNode;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class UcmNodeController extends Controller
{
    /**
     * Display a listing of the resource.
     * Redirects to the new cluster-focused index page.
     */
    public function index(): RedirectResponse
    {
        return redirect()->route('ucm-clusters.index');
    }

    /**
     * Display the specified resource (SSH Terminal).
     */
    public function show(UcmNode $ucmNode): Response
    {
        // Load the cluster relationship
        $ucmNode->load('ucmCluster');

        // Include password and SSH credentials for terminal functionality
        // Use cluster credentials for SSH (since nodes inherit from cluster)
        $cluster = $ucmNode->ucmCluster;
        $ucmNodeWithCredentials = $ucmNode->toArray();
        $ucmNodeWithCredentials['password'] = $ucmNode->password;

        // Use cluster SSH credentials if available, otherwise fall back to node credentials
        $ucmNodeWithCredentials['ssh_username'] = $cluster->ssh_username ?: $cluster->username ?: $ucmNode->username;
        $ucmNodeWithCredentials['ssh_password'] = $cluster->ssh_password ?: $cluster->password ?: $ucmNode->password;
        $ucmNodeWithCredentials['ssh_port'] = 22;

        return Inertia::render('UcmNode/Show', [
            'ucmNode' => $ucmNodeWithCredentials,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(UcmNode $ucmNode): RedirectResponse
    {
        // Redirect to show method for SSH terminal functionality
        return redirect()->route('ucm-nodes.show', $ucmNode);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, UcmNode $ucmNode): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ucm_nodes,name,' . $ucmNode->id,
                'hostname' => 'required|string|max:255|unique:ucm_nodes,hostname,' . $ucmNode->id,
                'username' => 'required|string|max:255',
                'password' => 'nullable|string',
                'schema_version' => 'required|string|max:50',
                'ssh_username' => 'nullable|string|max:255',
                'ssh_password' => 'nullable|string',
            ]);

            // Only update password if provided
            if (empty($validated['password'])) {
                unset($validated['password']);
            }

            // Only update SSH password if provided
            if (empty($validated['ssh_password'])) {
                unset($validated['ssh_password']);
            }

            $ucmNode->update($validated);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'UCM Server Updated',
                    'message' => 'UCM server updated successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to update UCM server', [
                'ucm_node_id' => $ucmNode->id,
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
    public function testConnection(UcmNode $ucmNode): RedirectResponse
    {
        try {
            Log::info("Testing API connection for UCM: {$ucmNode->name}");

            $apiVersion = $ucmNode->updateVersionFromApi();

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
                'ucm_node_id' => $ucmNode->id,
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
    public function destroy(UcmNode $ucmNode): RedirectResponse
    {
        try {
            $ucmNode->delete();

            return redirect()->route('ucm-clusters.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'UCM Server Deleted',
                    'message' => 'UCM server deleted successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to delete UCM server', [
                'ucm_node_id' => $ucmNode->id,
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
