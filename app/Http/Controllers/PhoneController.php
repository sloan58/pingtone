<?php

namespace App\Http\Controllers;

use Exception;
use SoapFault;
use Inertia\Inertia;
use App\Models\Phone;
use App\ApiClients\AxlSoap;
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

        $phoneButtonTemplate = PhoneButtonTemplate::where('name', $phone->phoneTemplateName['_'])->first();

        $mohAudioSources = MohAudioSource::where('ucm_id', $phone->ucm_id)
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'sourceId']);

        return Inertia::render('Phones/Edit', [
            'phone' => $phone,
            'phoneButtonTemplate' => $phoneButtonTemplate,
            'mohAudioSources' => $mohAudioSources,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Phone $phone)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'devicePoolName' => ['nullable'],
            'commonDeviceConfigName' => ['nullable'],
            'phoneTemplateName' => ['nullable'],
            'commonPhoneConfigName' => ['nullable'],
            'callingSearchSpaceName' => ['nullable'],
            'locationName' => ['nullable'],
            'mediaResourceListName' => ['nullable'],
            'automatedAlternateRoutingCssName' => ['nullable'],
            'userHoldMohAudioSourceId' => ['nullable', 'string'],
            'networkHoldMohAudioSourceId' => ['nullable', 'string'],
            'buttons' => ['sometimes', 'array'],
            'lines' => ['sometimes', 'array'],
            'speedDials' => ['sometimes', 'array'],
            'blfs' => ['sometimes', 'array'],
        ]);

        try {
            // Step 1: Update the phone in UCM via AXL API
            $axlApi = new AxlSoap($phone->ucm);

            // Send the validated data as-is to UCM (same format we received)
            $axlApi->updatePhone($request->all());

            // Step 2: If UCM update succeeds, update our local database
            $phone->update($axlApi->getPhoneByName($phone->name));

            return back()->with('toast', [
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
