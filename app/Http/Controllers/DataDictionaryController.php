<?php

namespace App\Http\Controllers;

use App\Models\DataDictionaryField;
use App\Models\DataDictionaryTable;
use App\Models\UcmCluster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DataDictionaryController extends Controller
{
    public function index(UcmCluster $ucmCluster)
    {
        return inertia('DataDictionary/Index', [
            'ucmId' => $ucmCluster->id,
            'version' => $ucmCluster->schema_version ?? 'Unknown',
            'clusterName' => $ucmCluster->name,
        ]);
    }
    /**
     * Get data dictionary for a specific UCM cluster.
     */
    public function getDataDictionary(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        try {
            $version = $ucmCluster->schema_version;
            
            if (!$version) {
                return response()->json([
                    'error' => 'No schema version configured for this cluster'
                ], 400);
            }

            // Get search parameters
            $searchTerm = $request->get('search', '');
            $useRegex = $request->boolean('use_regex', false);

            // Load tables with optional search
            $tablesQuery = DataDictionaryTable::forVersion($version);
            
            if ($searchTerm) {
                $tablesQuery->searchTerm($searchTerm, $useRegex);
            }
            
            $tables = $tablesQuery->orderBy('name')->get();

            // Get field counts for each table
            $tableNames = $tables->pluck('name')->toArray();
            $fieldCounts = [];
            
            foreach ($tableNames as $tableName) {
                $count = DataDictionaryField::forVersion($version)
                    ->where('table_name', $tableName)
                    ->count();
                $fieldCounts[$tableName] = $count;
            }

            // Add field counts to tables
            $tables->each(function ($table) use ($fieldCounts) {
                $table->field_count = $fieldCounts[$table->name] ?? 0;
            });

            Log::info("Retrieved data dictionary for UCM cluster", [
                'cluster_id' => $ucmCluster->id,
                'version' => $version,
                'tables_count' => $tables->count(),
                'search_term' => $searchTerm,
            ]);

            return response()->json([
                'version' => $version,
                'tables' => $tables->toArray(), // Convert to array to ensure proper serialization
                'total_tables' => $tables->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve data dictionary', [
                'cluster_id' => $ucmCluster->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to retrieve data dictionary: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed information for a specific table.
     */
    public function getTableDetails(UcmCluster $ucmCluster, string $tableName, Request $request): JsonResponse
    {
        try {
            $version = $ucmCluster->schema_version;
            
            if (!$version) {
                return response()->json([
                    'error' => 'No schema version configured for this cluster'
                ], 400);
            }

            // Get the table
            $table = DataDictionaryTable::forVersion($version)
                ->where('name', $tableName)
                ->first();

            if (!$table) {
                return response()->json([
                    'error' => "Table '{$tableName}' not found in data dictionary for version {$version}"
                ], 404);
            }

            // Get search parameters for fields
            $fieldSearch = $request->get('field_search', '');
            $fieldUseRegex = $request->boolean('field_use_regex', false);

            // Load fields with optional search
            $fieldsQuery = DataDictionaryField::forVersion($version)
                ->forTable($tableName);
            
            if ($fieldSearch) {
                $fieldsQuery->searchTerm($fieldSearch, $fieldUseRegex);
            }
            
            $fields = $fieldsQuery->orderBy('name')->get();

            Log::info("Retrieved table details", [
                'cluster_id' => $ucmCluster->id,
                'version' => $version,
                'table_name' => $tableName,
                'fields_count' => $fields->count(),
                'field_search' => $fieldSearch,
            ]);

            return response()->json([
                'table' => $table,
                'fields' => $fields->toArray(), // Ensure proper serialization
                'total_fields' => $fields->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve table details', [
                'cluster_id' => $ucmCluster->id,
                'table_name' => $tableName,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to retrieve table details: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available UCM versions that have data dictionary data.
     */
    public function getAvailableVersions(): JsonResponse
    {
        try {
            $versions = DataDictionaryTable::all()
                ->pluck('version')
                ->unique()
                ->sort()
                ->values();

            return response()->json([
                'versions' => $versions,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve available versions', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to retrieve available versions: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search across all tables and fields for a specific version.
     */
    public function search(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        try {
            $version = $ucmCluster->schema_version;
            
            if (!$version) {
                return response()->json([
                    'error' => 'No schema version configured for this cluster'
                ], 400);
            }

            $validated = $request->validate([
                'query' => 'required|string|min:1|max:255',
                'use_regex' => 'boolean',
                'search_tables' => 'boolean',
                'search_fields' => 'boolean',
            ]);

            $query = $validated['query'];
            $useRegex = $validated['use_regex'] ?? false;
            $searchTables = $validated['search_tables'] ?? true;
            $searchFields = $validated['search_fields'] ?? true;

            $results = [
                'tables' => [],
                'fields' => [],
            ];

            // Search tables
            if ($searchTables) {
                $results['tables'] = DataDictionaryTable::forVersion($version)
                    ->searchTerm($query, $useRegex)
                    ->orderBy('name')
                    ->get();
            }

            // Search fields
            if ($searchFields) {
                $results['fields'] = DataDictionaryField::forVersion($version)
                    ->searchTerm($query, $useRegex)
                    ->orderBy('table_name')
                    ->orderBy('name')
                    ->get();
            }

            Log::info("Performed data dictionary search", [
                'cluster_id' => $ucmCluster->id,
                'version' => $version,
                'query' => $query,
                'use_regex' => $useRegex,
                'tables_found' => count($results['tables']),
                'fields_found' => count($results['fields']),
            ]);

            return response()->json($results);

        } catch (\Exception $e) {
            Log::error('Failed to perform data dictionary search', [
                'cluster_id' => $ucmCluster->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to perform search: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get table and field suggestions for SQL autocomplete.
     */
    public function getSuggestions(UcmCluster $ucmCluster, Request $request): JsonResponse
    {
        try {
            $version = $ucmCluster->schema_version;
            
            if (!$version) {
                return response()->json([
                    'error' => 'No schema version configured for this cluster'
                ], 400);
            }

            $validated = $request->validate([
                'type' => 'required|in:tables,fields',
                'table' => 'string|nullable', // Required when type=fields
                'prefix' => 'string|nullable|max:50',
            ]);

            $type = $validated['type'];
            $prefix = $validated['prefix'] ?? '';
            $suggestions = [];

            if ($type === 'tables') {
                $query = DataDictionaryTable::forVersion($version);
                
                if ($prefix) {
                    $query->where('name', 'like', "{$prefix}%");
                }
                
                $suggestions = $query->orderBy('name')
                    ->limit(50)
                    ->pluck('name')
                    ->toArray();

            } elseif ($type === 'fields') {
                $tableName = $validated['table'];
                
                if (!$tableName) {
                    return response()->json([
                        'error' => 'Table name is required when requesting field suggestions'
                    ], 400);
                }

                $query = DataDictionaryField::forVersion($version)
                    ->forTable($tableName);
                
                if ($prefix) {
                    $query->where('name', 'like', "{$prefix}%");
                }
                
                $suggestions = $query->orderBy('name')
                    ->limit(50)
                    ->pluck('name')
                    ->toArray();
            }

            return response()->json([
                'suggestions' => $suggestions,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get suggestions', [
                'cluster_id' => $ucmCluster->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to get suggestions: ' . $e->getMessage()
            ], 500);
        }
    }
}