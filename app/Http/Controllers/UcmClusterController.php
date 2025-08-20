<?php

namespace App\Http\Controllers;

use App\Models\UcmCluster;
use App\Models\UcmNode;
use App\Services\Axl;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class UcmClusterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        // Show all clusters with their nodes
        $clusters = UcmCluster::with(['ucmNodes'])
            ->orderBy('name')
            ->get();

        return Inertia::render('UcmCluster/Index', [
            'clusters' => $clusters,
        ]);
    }

    /**
     * Show the UCM cluster onboarding wizard.
     */
    public function wizard(): Response
    {
        return Inertia::render('UcmCluster/Wizard', [
            'apiVersions' => UcmCluster::getApiVersions(),
        ]);
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
                'cluster_name' => 'required|string|max:255|unique:ucm_clusters,name',
                'ssh_username' => 'nullable|string|max:255',
                'ssh_password' => 'nullable|string',
            ]);

            // Use Axl service to discover cluster nodes
            $discoveryResult = Axl::discoverClusterNodes([
                'hostname' => $validated['hostname'],
                'username' => $validated['username'],
                'password' => $validated['password'],
                'schema_version' => $validated['schema_version'],
            ]);

            // Extract discovery results
            $version = $discoveryResult['version'];
            $nodes = $discoveryResult['nodes'];
            $publisherNode = $discoveryResult['publisher'];

            // Create the UcmCluster after successful discovery
            $cluster = UcmCluster::create([
                'name' => $validated['cluster_name'],
                'username' => $validated['username'],
                'password' => $validated['password'],
                'schema_version' => $validated['schema_version'],
                'ssh_username' => $validated['ssh_username'],
                'ssh_password' => $validated['ssh_password'],
                'version' => $version,
            ]);

            // Store all nodes in the database as UcmNode objects related to the cluster
            $createdNodes = [];
            $publisherUcm = null;

            foreach ($nodes as $node) {
                $ucmNodeData = [
                    'ucm_cluster_id' => $cluster->id,
                    'name' => $node['processnode'],
                    'hostname' => $node['processnode'] === $publisherNode['processnode'] ? $validated['hostname'] : $node['processnode'],
                    'version' => $version,
                    'node_role' => $node['type'],
                ];

                $ucmNode = UcmNode::create($ucmNodeData);
                $createdNodes[] = $ucmNode;

                if ($node['type'] === 'Publisher') {
                    $publisherUcm = $ucmNode;
                }

                Log::info("Created UCM node: {$node['processnode']} ({$node['type']})");
            }

            return response()->json([
                'success' => true,
                'message' => 'Cluster discovery completed successfully',
                'cluster_id' => $cluster->id,
                'cluster_name' => $cluster->name,
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
     * Display the specified resource.
     */
    public function show(UcmCluster $ucm_cluster): Response
    {
        $ucm_cluster->load(['ucmNodes', 'syncHistory' => function($query) {
            $query->orderBy('sync_start_time', 'desc')->limit(10);
        }]);

        return Inertia::render('UcmCluster/Show', [
            'cluster' => $ucm_cluster,
            'apiVersions' => UcmCluster::getApiVersions(),
        ]);
    }



    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, UcmCluster $ucm_cluster): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:ucm_clusters,name,' . $ucm_cluster->id,
                'username' => 'nullable|string|max:255',
                'password' => 'nullable|string',
                'schema_version' => 'nullable|string|max:50',
                'ssh_username' => 'nullable|string|max:255',
                'ssh_password' => 'nullable|string',
            ]);

            // Prepare cluster updates
            $clusterUpdates = ['name' => $validated['name']];
            
            if (!empty($validated['username'])) {
                $clusterUpdates['username'] = $validated['username'];
            }
            if (!empty($validated['password'])) {
                $clusterUpdates['password'] = $validated['password'];
            }
            if (!empty($validated['schema_version'])) {
                $clusterUpdates['schema_version'] = $validated['schema_version'];
            }
            if (!empty($validated['ssh_username'])) {
                $clusterUpdates['ssh_username'] = $validated['ssh_username'];
            }
            if (!empty($validated['ssh_password'])) {
                $clusterUpdates['ssh_password'] = $validated['ssh_password'];
            }

            // Update the cluster
            $ucm_cluster->update($clusterUpdates);

            // Also update all nodes in the cluster with new credentials if provided
            $nodeUpdates = [];
            if (!empty($validated['username'])) {
                $nodeUpdates['username'] = $validated['username'];
            }
            if (!empty($validated['password'])) {
                $nodeUpdates['password'] = $validated['password'];
            }
            if (!empty($validated['schema_version'])) {
                $nodeUpdates['schema_version'] = $validated['schema_version'];
            }
            if (!empty($validated['ssh_username'])) {
                $nodeUpdates['ssh_username'] = $validated['ssh_username'];
            }
            if (!empty($validated['ssh_password'])) {
                $nodeUpdates['ssh_password'] = $validated['ssh_password'];
            }

            if (!empty($nodeUpdates)) {
                $ucm_cluster->ucmNodes()->update($nodeUpdates);
                Log::info('Updated credentials for cluster and all nodes', [
                    'cluster_id' => $ucm_cluster->id,
                    'cluster_name' => $ucm_cluster->name,
                    'updated_fields' => array_keys($nodeUpdates),
                ]);
            }

            return redirect()->back()
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Cluster Updated',
                    'message' => 'UCM cluster and node credentials updated successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to update UCM cluster', [
                'cluster_id' => $ucm_cluster->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Update Cluster',
                    'message' => 'An error occurred while updating the UCM cluster. Please try again.'
                ]);
        }
    }

    /**
     * Execute SQL query on the cluster's publisher node.
     */
    public function executeSqlQuery(Request $request, UcmCluster $ucmCluster): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|max:10000',
            ]);

            Log::info("Executing SQL query for UCM Cluster: {$ucmCluster->name}", [
                'ucm_cluster_id' => $ucmCluster->id,
                'query' => $validated['query'],
            ]);

            // Create AXL client with cluster (will use publisher node)
            $axlApi = new Axl($ucmCluster);
            $results = $axlApi->performSqlQuery($validated['query']);

            // Transform results to match frontend expectations
            $transformedResults = $this->transformSqlResults($results);

            Log::info("SQL query executed successfully", [
                'ucm_cluster_id' => $ucmCluster->id,
                'rows_returned' => count($transformedResults['rows']),
            ]);

            return response()->json($transformedResults);

        } catch (Exception $e) {
            Log::error('Failed to execute SQL query', [
                'ucm_cluster_id' => $ucmCluster->id,
                'query' => $validated['query'] ?? 'N/A',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to execute SQL query: ' . $e->getMessage()
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(UcmCluster $ucm_cluster): RedirectResponse
    {
        try {
            $ucm_cluster->delete();

            return redirect()->route('ucm-clusters.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Cluster Deleted',
                    'message' => 'UCM cluster deleted successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to delete UCM cluster', [
                'cluster_id' => $ucm_cluster->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Delete Cluster',
                    'message' => 'An error occurred while deleting the UCM cluster. Please try again.'
                ]);
        }
    }
}
