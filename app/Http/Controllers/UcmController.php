<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Ucm;
use App\Services\Axl;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;

class UcmController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Only show publisher nodes in the main UCM table
        $ucms = Ucm::where('node_role', 'Publisher')
            ->orWhereNull('node_role') // Include legacy UCMs without node_role
            ->orderBy('name')
            ->get();

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
     * Show the UCM onboarding wizard.
     */
    public function wizard(): Response
    {
        return Inertia::render('Ucm/Wizard', [
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
                'ssh_username' => 'nullable|string|max:255',
                'ssh_password' => 'nullable|string',
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

            return redirect()->back()
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
     * Show the form for editing the specified resource.
     */
    public function edit(Ucm $ucm): Response
    {
        $syncHistory = $ucm->syncHistory()
            ->orderBy('sync_start_time', 'desc')
            ->limit(10)
            ->get();

        // Include password and SSH credentials for terminal functionality
        $ucmWithPassword = $ucm->toArray();
        $ucmWithPassword['password'] = $ucm->password;
        
        // Add SSH configuration from database or fallback to UCM credentials
        $ucmWithPassword['ssh_username'] = $ucm->ssh_username ?: $ucm->username;
        $ucmWithPassword['ssh_password'] = $ucm->ssh_password ?: $ucm->password;
        $ucmWithPassword['ssh_port'] = 22;

        return Inertia::render('Ucm/Edit', [
            'ucm' => $ucmWithPassword,
            'apiVersions' => Ucm::getApiVersions(),
            'syncHistory' => $syncHistory,
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

            $ucm->update($validated);

            return redirect()->back()
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
     * Discover UCM cluster nodes and store them.
     */
    public function discover(Request $request)
    {
        try {
            $validated = $request->validate([
                'hostname' => 'required|string|max:255',
                'username' => 'required|string|max:255',
                'password' => 'required|string',
                'schema_version' => 'required|string|max:50',
                'cluster_name' => 'required|string|max:255',
                'ssh_username' => 'nullable|string|max:255',
                'ssh_password' => 'nullable|string',
            ]);

            Log::info('Starting UCM cluster discovery', [
                'hostname' => $validated['hostname'],
                'username' => $validated['username'],
                'schema_version' => $validated['schema_version'],
                'cluster_name' => $validated['cluster_name'],
            ]);

            // Create a temporary UCM instance for API testing
            $tempUcm = new Ucm([
                'name' => 'temp-discovery',
                'hostname' => $validated['hostname'],
                'username' => $validated['username'],
                'password' => $validated['password'],
                'schema_version' => $validated['schema_version'],
            ]);

            // Test API connection
            $axlApi = $tempUcm->axlApi();
            $version = $axlApi->getCCMVersion();

            if (!$version) {
                throw new Exception('Failed to connect to UCM API or detect version');
            }

            Log::info("API connection successful, version: {$version}");

            // Query to get cluster nodes and their roles
            $sql = "SELECT p.name processnode, t.name type FROM processnode p JOIN typenodeusage t ON p.tknodeusage = t.enum WHERE p.name != 'EnterpriseWideData'";
            
            $nodes = $axlApi->performSqlQuery($sql);

            if (empty($nodes)) {
                throw new Exception('No cluster nodes found');
            }

            Log::info('Discovered cluster nodes', ['count' => count($nodes), 'nodes' => $nodes]);

            // Find publisher node
            $publisherNode = collect($nodes)->firstWhere('type', 'Publisher');
            
            if (!$publisherNode) {
                throw new Exception('No publisher node found in cluster');
            }

            // Store all nodes in the database
            $createdNodes = [];
            $publisherUcm = null;
            
            foreach ($nodes as $node) {
                $ucmData = [
                    'name' => $node['processnode'],
                    'cluster_name' => $validated['cluster_name'],
                    'hostname' => $node['processnode'] === $publisherNode['processnode'] ? $validated['hostname'] : $node['processnode'],
                    'username' => $validated['username'],
                    'password' => $validated['password'],
                    'schema_version' => $validated['schema_version'],
                    'version' => $version,
                    'node_role' => $node['type'],
                    'ssh_username' => $validated['ssh_username'],
                    'ssh_password' => $validated['ssh_password'],
                ];

                $ucm = Ucm::create($ucmData);
                $createdNodes[] = $ucm;
                
                if ($node['type'] === 'Publisher') {
                    $publisherUcm = $ucm;
                }
                
                Log::info("Created UCM node: {$node['processnode']} ({$node['type']})");
            }

            return response()->json([
                'success' => true,
                'message' => 'Cluster discovery completed successfully',
                'nodes' => $nodes,
                'publisher' => $publisherNode,
                'publisher_id' => $publisherUcm?->id,
                'created_count' => count($createdNodes),
            ]);

        } catch (Exception $e) {
            Log::error('UCM cluster discovery failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
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

    /**
     * Execute a SQL query against the UCM database
     */
    public function executeSqlQuery(Request $request, Ucm $ucm): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|max:10000',
            ]);

            Log::info("Executing SQL query for UCM: {$ucm->name}", [
                'ucm_id' => $ucm->id,
                'query' => $validated['query'],
            ]);

            // Create AXL client and execute query
            $axlApi = new Axl($ucm);
            $results = $axlApi->performSqlQuery($validated['query']);

            // Transform results to match frontend expectations
            $transformedResults = $this->transformSqlResults($results);

            Log::info("SQL query executed successfully", [
                'ucm_id' => $ucm->id,
                'rows_returned' => count($transformedResults['rows']),
            ]);

            return response()->json($transformedResults);

        } catch (Exception $e) {
            Log::error("SQL query execution failed", [
                'ucm_id' => $ucm->id,
                'query' => $validated['query'] ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Query execution failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Transform SQL results to match frontend table expectations
     */
    private function transformSqlResults(array $results): array
    {
        if (empty($results)) {
            return [
                'rows' => [],
                'columns' => [],
            ];
        }

        // Get column names from the first row
        $firstRow = $results[0];
        $columns = [];
        
        foreach (array_keys($firstRow) as $columnName) {
            $columns[] = [
                'data_field' => $columnName,
                'text' => ucwords(str_replace('_', ' ', $columnName)),
                'sort' => true,
                'filter' => true,
            ];
        }

        return [
            'rows' => $results,
            'columns' => $columns,
        ];
    }
}
