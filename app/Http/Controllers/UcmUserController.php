<?php

namespace App\Http\Controllers;

use Log;
use Exception;
use SoapFault;
use Inertia\Inertia;
use App\Models\UcmUser;
use App\Services\Axl;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\AppliesSearchFilters;

class UcmUserController extends Controller
{
    use AppliesSearchFilters;

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = UcmUser::query()
            ->with(['ucm'])
            ->endUsers();

        // Filters (AdvancedSearch) via JSON to avoid query parser issues
        $rawFilters = $request->input('filters_json');
        $filters = [];
        if (is_string($rawFilters) && $rawFilters !== '') {
            $decoded = json_decode($rawFilters, true);
            if (is_array($decoded)) {
                $filters = array_values(array_filter($decoded, function ($row) {
                    return is_array($row) && isset($row['field'], $row['operator']) && ($row['value'] ?? '') !== '';
                }));
            }
        }
        $logic = strtolower((string)$request->input('logic', 'and')) === 'or' ? 'or' : 'and';
        if (!empty($filters)) {
            $this->applyFilters($query, $filters, $logic, [
                'name', 'userid', 'firstName', 'lastName', 'mailid', 'department', 'ucm_id'
            ]);
        }

        // TanStack Table server-driven paging/sorting (filters to be added later if needed)
        $sort = (string)$request->input('sort', 'name:asc');
        [$sortField, $sortDir] = array_pad(explode(':', $sort, 2), 2, 'asc');
        $sortField = in_array($sortField, ['name', 'userid', 'firstName', 'lastName', 'mailid', 'department']) ? $sortField : 'name';
        $sortDir = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        $perPage = (int)$request->input('perPage', 20);
        if ($perPage < 5 || $perPage > 100) {
            $perPage = 20;
        }

        $users = $query->orderBy($sortField, $sortDir)
            ->paginate($perPage)
            ->appends($request->only('page', 'perPage', 'sort'));

        return Inertia::render('UcmUsers/Index', [
            'users' => $users,
            'tableState' => [
                'sort' => $sortField . ':' . $sortDir,
                'perPage' => $perPage,
            ],
            'filters' => [
                'applied' => $filters,
                'logic' => $logic,
            ],
        ]);
    }


}
