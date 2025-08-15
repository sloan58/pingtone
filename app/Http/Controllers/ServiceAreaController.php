<?php

namespace App\Http\Controllers;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\ServiceArea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\RedirectResponse;

class ServiceAreaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = ServiceArea::query();

        // Handle sorting
        $sortField = $request->get('sort', 'name:asc');
        [$field, $direction] = explode(':', $sortField);
        $query->orderBy($field, $direction);

        // Handle search filters
        if ($request->has('filters_json') && $request->get('filters_json')) {
            $filters = json_decode($request->get('filters_json'), true);
            $logic = $request->get('logic', 'and');

            if ($filters && is_array($filters)) {
                $query->where(function ($q) use ($filters, $logic) {
                    foreach ($filters as $index => $filter) {
                        if (!isset($filter['field']) || !isset($filter['value'])) {
                            continue;
                        }

                        $method = $index === 0 ? 'where' : ($logic === 'or' ? 'orWhere' : 'where');
                        $operator = $filter['operator'] ?? 'contains';

                        // Handle nested fields for userFilters
                        if (str_starts_with($filter['field'], 'userFilters.')) {
                            $nestedField = str_replace('userFilters.', '', $filter['field']);
                            switch ($operator) {
                                case 'contains':
                                    $q->$method("userFilters.$nestedField", 'like', '%' . $filter['value'] . '%');
                                    break;
                                case 'equals':
                                    $q->$method("userFilters.$nestedField", $filter['value']);
                                    break;
                                case 'starts_with':
                                    $q->$method("userFilters.$nestedField", 'like', $filter['value'] . '%');
                                    break;
                                case 'ends_with':
                                    $q->$method("userFilters.$nestedField", 'like', '%' . $filter['value']);
                                    break;
                            }
                        } else {
                            switch ($operator) {
                                case 'contains':
                                    $q->$method($filter['field'], 'like', '%' . $filter['value'] . '%');
                                    break;
                                case 'equals':
                                    $q->$method($filter['field'], $filter['value']);
                                    break;
                                case 'starts_with':
                                    $q->$method($filter['field'], 'like', $filter['value'] . '%');
                                    break;
                                case 'ends_with':
                                    $q->$method($filter['field'], 'like', '%' . $filter['value']);
                                    break;
                            }
                        }
                    }
                });
            }
        }

        $perPage = $request->get('perPage', 20);
        $serviceAreas = $query->paginate($perPage);
        
        // Add user count manually for MongoDB compatibility
        $serviceAreas->getCollection()->transform(function ($serviceArea) {
            $serviceArea->ucm_users_count = $serviceArea->ucmUsers()->count();
            return $serviceArea;
        });

        return Inertia::render('ServiceAreas/Index', [
            'serviceAreas' => $serviceAreas,
            'tableState' => [
                'sort' => $sortField,
                'perPage' => (int) $perPage,
            ],
            'filters' => [
                'applied' => $request->has('filters_json') ? json_decode($request->get('filters_json'), true) : [],
                'logic' => $request->get('logic', 'and'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('ServiceAreas/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:service_areas',
                'userFilters' => 'nullable|array',
                'userFilters.field' => 'nullable|string|in:mailid,telephoneNumber',
                'userFilters.regex' => 'nullable|string|max:500',
            ]);

            ServiceArea::create($validated);

            return redirect()->route('service-areas.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Service Area Created',
                    'message' => 'Service area created successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to create service area', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Create Service Area',
                    'message' => 'An error occurred while creating the service area. Please try again.'
                ]);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ServiceArea $serviceArea): Response
    {
        $serviceArea->load('ucmUsers');
        
        return Inertia::render('ServiceAreas/Edit', [
            'serviceArea' => $serviceArea,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceArea $serviceArea): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:service_areas,name,' . $serviceArea->id,
                'userFilters' => 'nullable|array',
                'userFilters.field' => 'nullable|string|in:mailid,telephoneNumber',
                'userFilters.regex' => 'nullable|string|max:500',
            ]);

            $serviceArea->update($validated);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Service Area Updated',
                    'message' => 'Service area updated successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to update service area', [
                'service_area_id' => $serviceArea->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
            ]);

            return redirect()->back()
                ->withInput()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Update Service Area',
                    'message' => 'An error occurred while updating the service area. Please try again.'
                ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceArea $serviceArea): RedirectResponse
    {
        try {
            $serviceArea->delete();

            return redirect()->route('service-areas.index')
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Service Area Deleted',
                    'message' => 'Service area deleted successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to delete service area', [
                'service_area_id' => $serviceArea->id,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to Delete Service Area',
                    'message' => 'An error occurred while deleting the service area. Please try again.'
                ]);
        }
    }

    /**
     * Manually trigger user assignment to service areas
     */
    public function triggerAssignment(): RedirectResponse
    {
        try {
            ServiceArea::triggerUserAssignment();

            return redirect()->back()
                ->with('toast', [
                    'type' => 'success',
                    'title' => 'Assignment Triggered',
                    'message' => 'User assignment job has been queued successfully.'
                ]);
        } catch (Exception $e) {
            Log::error('Failed to trigger user assignment', [
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()
                ->with('toast', [
                    'type' => 'error',
                    'title' => 'Assignment Failed',
                    'message' => 'An error occurred while triggering user assignment. Please try again.'
                ]);
        }
    }
}
