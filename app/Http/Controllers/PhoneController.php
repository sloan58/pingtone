<?php

namespace App\Http\Controllers;

use Log;
use Exception;
use SoapFault;
use Inertia\Inertia;
use App\Models\Phone;
use App\Services\Axl;
use App\Models\PhoneStatus;
use Illuminate\Http\Request;
use App\Models\MohAudioSource;
use App\Models\PhoneButtonTemplate;
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
        $logic = strtolower((string) $request->input('logic', 'and')) === 'or' ? 'or' : 'and';
        if (!empty($filters)) {
            $this->applyFilters($query, $filters, $logic, [
                'name', 'description', 'model', 'devicePoolName', 'device_pool_name', 'ucm_id'
            ]);
        }

        // TanStack Table server-driven paging/sorting (filters to be added later if needed)
        $sort = (string) $request->input('sort', 'name:asc');
        [$sortField, $sortDir] = array_pad(explode(':', $sort, 2), 2, 'asc');
        $sortField = in_array($sortField, ['name','description','model','devicePoolName']) ? $sortField : 'name';
        $sortDir = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        $perPage = (int) $request->input('perPage', 20);
        if ($perPage < 5 || $perPage > 100) { $perPage = 20; }

        $phones = $query->orderBy($sortField, $sortDir)
            ->paginate($perPage)
            ->appends($request->only('page','perPage','sort'));

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
            'tableState' => [
                'sort' => $sortField.':'.$sortDir,
                'perPage' => $perPage,
            ],
            'filters' => [
                'applied' => $filters,
                'logic' => $logic,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Phone $phone)
    {
        $phone->load('ucm');

        // Get the latest RisPort status for this phone
        $latestStatus = PhoneStatus::where('phone_name', $phone->name)
            ->where('ucm_id', $phone->ucm_id)
            ->orderBy('timestamp', 'desc')
            ->first() ?? [];

        // Ensure we get the template from the same UCM as the phone
        $phoneButtonTemplate = null;
        if (isset($phone->phoneTemplateName['_'])) {
            $phoneButtonTemplate = PhoneButtonTemplate::where('ucm_id', $phone->ucm_id)
                ->where('name', $phone->phoneTemplateName['_'])
                ->first();
        }

        $mohAudioSources = MohAudioSource::where('ucm_id', $phone->ucm_id)
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'sourceId']);

        return Inertia::render('Phones/Edit', [
            'phone' => $phone->toArray() + ['latestStatus' => $latestStatus],
            'phoneButtonTemplate' => $phoneButtonTemplate,
            'mohAudioSources' => $mohAudioSources,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Phone $phone)
    {
        try {
            // Step 1: Transform boolean values back to UCM-compatible string format
            $updateData = $request->all();

            // Debug: Log what we received for digestUser
            Log::info('Phone update - digestUser field:', [
                'digestUser' => $updateData['digestUser'] ?? 'NOT_SET',
                'has_digestUser' => isset($updateData['digestUser']),
            ]);

            // Step 2: Update the phone in UCM via AXL API
            $axlApi = new Axl($phone->ucm);

            // Send the transformed data to UCM
            $axlApi->updatePhone($updateData);

            // Step 3: If UCM update succeeds, update our local database with fresh UCM data
            $freshUcmData = $axlApi->getPhoneByName($phone->name);
            $phone->update($freshUcmData);

            // Step 4: Refresh the phone model to ensure we have the latest data
            $phone->refresh();

            // Step 5: Redirect to edit page with fresh data to ensure UI reflects current UCM state
            // Use the phone ID to force a fresh database query instead of using the cached model instance
            return redirect()->route('phones.edit', $phone)->with('toast', [
                'type' => 'success',
                'title' => 'Phone updated',
                'message' => 'The phone was updated successfully in UCM and local database.',
            ]);

        } catch (SoapFault $e) {
            // UCM update failed - return error and original data
            return back()->with('toast', [
                'type' => 'error',
                'title' => 'Update failed',
                'message' => 'Failed to update phone in UCM: ' . $e->getMessage(),
            ])->withErrors(['ucm' => 'Failed to update phone in UCM: ' . $e->getMessage()]);

        } catch (Exception $e) {
            // Unexpected error
            return back()->with('toast', [
                'type' => 'error',
                'title' => 'Update failed',
                'message' => 'An unexpected error occurred: ' . $e->getMessage(),
            ])->withErrors(['general' => 'An unexpected error occurred: ' . $e->getMessage()]);
        }
    }
}
