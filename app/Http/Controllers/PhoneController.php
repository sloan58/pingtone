<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\AppliesSearchFilters;
use App\Models\Line;
use App\Models\MohAudioSource;
use App\Models\Phone;
use App\Models\PhoneButtonTemplate;
use App\Models\PhoneScreenCapture;
use App\Models\ServiceAreaDeviceLink;
use App\Services\PhoneScreenCaptureService;
use Exception;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Log;
use SoapFault;

class PhoneController extends Controller
{
    use AppliesSearchFilters;

    protected PhoneScreenCaptureService $screenCaptureService;

    public function __construct(PhoneScreenCaptureService $screenCaptureService)
    {
        $this->screenCaptureService = $screenCaptureService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Phone::query()->with(['ucmCluster']);

        // Filter by service area if provided
        if ($serviceAreaId = $request->get('service_area_id')) {
            $phoneIds = ServiceAreaDeviceLink::where('service_area_id', $serviceAreaId)
                ->where('device_type', 'Phone')
                ->pluck('device_id');
            $query->whereIn('_id', $phoneIds);
        }

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
            // Handle calling search space filtering separately since it's a nested field
            $cssFilters = array_filter($filters, function($filter) {
                return $filter['field'] === 'callingSearchSpaceName._';
            });

            $otherFilters = array_filter($filters, function($filter) {
                return $filter['field'] !== 'callingSearchSpaceName._';
            });

            // Apply regular filters
            if (!empty($otherFilters)) {
                $this->applyFilters($query, array_values($otherFilters), $logic, [
                    'name', 'description', 'model', 'devicePoolName', 'device_pool_name', 'ucm_cluster_id'
                ]);
            }

            // Apply calling search space filters
            if (!empty($cssFilters)) {
                foreach ($cssFilters as $filter) {
                    $operator = strtolower($filter['operator']);
                    $value = $filter['value'];

                    switch ($operator) {
                        case 'equals':
                            $query->where('callingSearchSpaceName._', '=', $value);
                            break;
                        case 'not_equals':
                            $query->where('callingSearchSpaceName._', '!=', $value);
                            break;
                        case 'contains':
                            $like = '%'.str_replace(['%', '_'], ['\%','\_'], (string) $value).'%';
                            $query->where('callingSearchSpaceName._', 'like', $like);
                            break;
                        case 'starts_with':
                            $like = str_replace(['%', '_'], ['\%','\_'], (string) $value).'%';
                            $query->where('callingSearchSpaceName._', 'like', $like);
                            break;
                        case 'ends_with':
                            $like = '%'.str_replace(['%', '_'], ['\%','\_'], (string) $value);
                            $query->where('callingSearchSpaceName._', 'like', $like);
                            break;
                        case 'in':
                            $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                            if (!empty($vals)) {
                                $query->whereIn('callingSearchSpaceName._', $vals);
                            }
                            break;
                        case 'not_in':
                            $vals = is_array($value) ? $value : array_filter(array_map('trim', explode(',', (string) $value)));
                            if (!empty($vals)) {
                                $query->whereNotIn('callingSearchSpaceName._', $vals);
                            }
                            break;
                    }
                }
            }
        }

        // TanStack Table server-driven paging/sorting (filters to be added later if needed)
        $sort = (string)$request->input('sort', 'name:asc');
        [$sortField, $sortDir] = array_pad(explode(':', $sort, 2), 2, 'asc');
        $sortField = in_array($sortField, ['name', 'description', 'model', 'devicePoolName']) ? $sortField : 'name';
        $sortDir = strtolower($sortDir) === 'desc' ? 'desc' : 'asc';

        $perPage = (int)$request->input('perPage', 20);
        if ($perPage < 5 || $perPage > 100) {
            $perPage = 20;
        }

        $phones = $query->orderBy($sortField, $sortDir)
            ->paginate($perPage)
            ->appends($request->only('page', 'perPage', 'sort'));

        return Inertia::render('Phones/Index', [
            'phones' => $phones,
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

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Phone $phone)
    {
        $phone->load('ucmCluster');
        $phone->append('latestStatus');

        // Load service areas using custom relationship
        $phone->service_areas = $phone->serviceAreas()->get();

        // Ensure we get the template from the same UCM as the phone
        // We need the template details on page load to build the button UI
        $phoneButtonTemplate = null;
        if (isset($phone->phoneTemplateName['_'])) {
            $phoneButtonTemplate = PhoneButtonTemplate::where('ucm_cluster_id', $phone->ucm_cluster_id)
                ->where('name', $phone->phoneTemplateName['_'])
                ->first();
        }

        // The phone moh setting doesn't have the friendly name to display in the select
        // so we're sending all the information in another field.
        $mohAudioSources = MohAudioSource::where('ucm_cluster_id', $phone->ucm_cluster_id)
            ->orderBy('name')
            ->get(['_id', 'uuid', 'name', 'sourceId']);

        // Get screen captures for this phone
        $screenCaptures = $this->screenCaptureService->getScreenCaptures($phone);

        // Transform screen captures to include accessors and match frontend expectations
        $transformedScreenCaptures = $screenCaptures->map(function ($capture) {
            return [
                'id' => $capture->_id,
                'filename' => $capture->filename,
                'captured_at' => $capture->captured_at->toISOString(),
                'image_url' => $capture->image_url,
                'formatted_file_size' => $capture->formatted_file_size,
                'captured_by' => $capture->captured_by,
            ];
        });

        $canScreenCapture = $phone->canScreenCapture();

        Log::info('Phone edit page - screen capture check', [
            'phone_id' => $phone->_id,
            'phone_name' => $phone->name,
            'model' => $phone->model,
            'currentStatus' => $phone->currentStatus,
            'currentIpAddress' => $phone->currentIpAddress,
            'canScreenCapture' => $canScreenCapture,
        ]);

        $phoneData = $phone->toArray();

        $globalLineData = [];
        foreach ($phoneData['lines']['line'] ?? [] as $index => $line) {
            if ($lineRecord = Line::where('uuid', $line['dirn']['uuid'])->first()) {
                $globalLineData[] = [
                    ...$lineRecord->toArray(),
                    'isShared' => $lineRecord->isShared
                ];
            }
        }

        return Inertia::render('Phones/Edit', [
            'phone' => $phoneData + ['canScreenCapture' => $canScreenCapture],
            'globalLineData' => $globalLineData,
            'phoneButtonTemplate' => $phoneButtonTemplate,
            'mohAudioSources' => $mohAudioSources,
            'screenCaptures' => $transformedScreenCaptures,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Phone $phone)
    {
        try {
            $updateData = $request->all();

            $phone->updateAndSync($updateData);

            $phone->refresh();

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

    /**
     * Capture a screenshot from the phone.
     */
    public function captureScreenshot(Phone $phone)
    {
        try {
            $screenCapture = $this->screenCaptureService->captureScreenshot($phone);

            // Transform the data to include accessors and match frontend expectations
            $screenCaptureData = [
                'id' => $screenCapture->_id,
                'filename' => $screenCapture->filename,
                'captured_at' => $screenCapture->captured_at->toISOString(),
                'image_url' => $screenCapture->image_url,
                'formatted_file_size' => $screenCapture->formatted_file_size,
                'captured_by' => $screenCapture->captured_by,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Screenshot captured successfully',
                'screenCapture' => $screenCaptureData,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to capture screenshot: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a screen capture.
     */
    public function deleteScreenCapture(PhoneScreenCapture $screenCapture)
    {
        try {
            $success = $this->screenCaptureService->deleteScreenCapture($screenCapture);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Screen capture deleted successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete screen capture',
                ], 500);
            }

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete screen capture: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for editing a specific button on a phone.
     */
    public function editButton(Request $request, Phone $phone, int $buttonIndex)
    {
        $phone->load('ucmCluster');

        // Get the button configuration
        $buttonConfig = null;
        if (isset($phone->lines['line'])) {
            $lines = is_array($phone->lines['line']) ? $phone->lines['line'] : [$phone->lines['line']];
            $buttonConfig = collect($lines)->firstWhere('index', (string)$buttonIndex);
        }

        if (!$buttonConfig) {
            abort(404, 'Button configuration not found');
        }

        // Get the line details based on the button type
        $line = null;
        $associatedDevices = null;
        $type = $request->query('type', 'line');

        switch ($type) {
            case 'line':
                if (isset($buttonConfig['dirn']['uuid'])) {
                    $line = Line::where('uuid', $buttonConfig['dirn']['uuid'])->first();
                    $associatedDevices = Phone::withoutGlobalScope("device_class")
                        ->where('ucm_cluster_id', $line->ucm_cluster_id)
                        ->where('lines.line.dirn.uuid', $line->uuid)
                        ->select(['id', 'name', 'class'])
                    ->get()->toArray();
                }
                break;
            // Add other button types here as needed (speed dial, etc.)
            default:
                abort(400, 'Invalid button type');
        }

        if (!$line) {
            abort(404, 'Line not found');
        }

            return Inertia::render('Phones/EditButton', [
            'phone' => $phone,
            'buttonIndex' => $buttonIndex,
            'buttonType' => $type,
            'buttonConfig' => $buttonConfig,
            'line' => $line->append('patternAndPartition')->toArray(),
            'associatedDevices' => $associatedDevices,
        ]);
    }

    /**
     * Update a line configuration
     */
    public function updateLine(Request $request, Phone $phone, int $lineIndex)
    {
        $request->validate([
            'line' => 'required|array',
            'targetLineConfig' => 'required|array',
        ]);

        $lineData = $request->input('line');
        $targetLineConfig = $request->input('targetLineConfig');

        try {
            $line = Line::where('uuid', $lineData['uuid'])->first();
            if (!$line) {
                return response()->json(['error' => 'Line not found'], 404);
            }

            $line->updateAndSync($lineData);

            return response()->json([
                'success' => true,
                'message' => 'Line updated successfully',
                'line' => $line->fresh()->append('patternAndPartition'),
                'targetLineConfig' => $targetLineConfig, // Return the phone-specific config as-is for now
            ]);

        } catch (SoapFault $e) {
            // UCM update failed - return error
            return response()->json([
                'error' => 'Failed to update line in UCM: ' . $e->getMessage()
            ], 500);

        } catch (Exception $e) {
            // Unexpected error
            return response()->json([
                'error' => 'An unexpected error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Dissociate a line from a device (Phone, DeviceProfile, or RemoteDestinationProfile)
     */
    public function dissociateLine(string $device_id, string $line_id)
    {
        try {
            // Find the device by MongoDB ID - check all device types
            $device = Phone::withoutGlobalScope('device_class')->find($device_id);

            if (!$device) {
                return response()->json([
                    'error' => 'Device not found'
                ], 404);
            }

            // Find the line by MongoDB ID to get its UUID for filtering
            $line = Line::find($line_id);

            if (!$line) {
                return response()->json([
                    'error' => 'Line not found'
                ], 404);
            }

            // Get the current device data
            $deviceData = $device->toArray();

            // Check if the device has lines and filter out the specified line
            if (!isset($deviceData['lines']['line']) || !is_array($deviceData['lines']['line'])) {
                return response()->json([
                    'error' => 'Device has no lines configured'
                ], 400);
            }

            // Filter out the line with the matching UUID
            $originalLines = $deviceData['lines']['line'];
            $filteredLines = array_filter($originalLines, function($deviceLine) use ($line) {
                return isset($deviceLine['dirn']['uuid']) && $deviceLine['dirn']['uuid'] !== $line->uuid;
            });

            // Check if any line was actually removed
            if (count($filteredLines) === count($originalLines)) {
                return response()->json([
                    'error' => 'Line not found on this device'
                ], 400);
            }

            // Prepare update data - reindex the array to ensure proper indexing
            $updateData = [
                'name' => $device->name,
                'lines' => [
                    'line' => array_values($filteredLines)
                ]
            ];

            // Update the device using updateAndSync (works for all device types)
            $device->updateAndSync($updateData);

            // Return updated associated devices
            $associatedDevices = $line->getAssociatedDevices();

            return response()->json([
                'success' => true,
                'message' => 'Line dissociated successfully',
                'associatedDevices' => $associatedDevices
            ]);

        } catch (SoapFault $e) {
            // UCM update failed
            return response()->json([
                'error' => 'Failed to dissociate line in UCM: ' . $e->getMessage()
            ], 500);

        } catch (Exception $e) {
            // Unexpected error
            return response()->json([
                'error' => 'An unexpected error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

}
