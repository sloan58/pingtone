<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Phone;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\PhoneControlService;

class PhoneApiController extends Controller
{
    /**
     * Gather API data for a specific phone
     *
     * @param Request $request
     * @param string $phoneId
     * @return JsonResponse
     */
    public function gatherData(Request $request, string $phoneId): JsonResponse
    {
        try {
            $phone = Phone::findOrFail($phoneId);

            $phoneControlService = new PhoneControlService();
            $result = $phoneControlService->gatherPhoneData($phone);

            $phone->update([
                'api_data' => $result['api_data']
            ]);

            if ($result['success']) {
                Log::info("Successfully gathered and stored phone API data", [
                    'phone' => $phone->name,
                    'ucm' => $phone->ucmCluster->name,
                    'has_network_data' => !empty($result['api_data']['network']),
                    'has_config_data' => !empty($result['api_data']['config']),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Phone API data gathered successfully',
                    'toast' => [
                        'type' => 'success',
                        'message' => 'Phone API data gathered successfully'
                    ],
                    'data' => [
                        'network' => $result['api_data']['network'],
                        'config' => $result['api_data']['config'],
                        'port' => $result['api_data']['port'],
                        'log' => $result['api_data']['log'],
                        'timestamp' => $result['api_data']['timestamp']->toDateTime()->format('c'),
                        'ip_address' => $result['api_data']['ip_address'],
                    ]
                ]);
            } else {
                Log::warning("Failed to gather phone API data", [
                    'phone' => $phone->name,
                    'ucm' => $phone->ucmCluster->name,
                    'error' => $result['error'],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to gather phone API data',
                    'error' => $result['error'],
                    'toast' => [
                        'type' => 'error',
                        'message' => 'Failed to gather phone API data: ' . $result['error']
                    ],
                    'data' => [
                        'network' => $result['api_data']['network'],
                        'config' => $result['api_data']['config'],
                        'port' => $result['api_data']['port'],
                        'log' => $result['api_data']['log'],
                        'timestamp' => $result['api_data']['timestamp']->toDateTime()->format('c'),
                        'ip_address' => $result['api_data']['ip_address'],
                    ]
                ], 400);
            }

        } catch (Exception $e) {
            Log::error("Error in phone API data gathering", [
                'phone_id' => $phoneId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while gathering phone API data',
                'error' => $e->getMessage(),
                'toast' => [
                    'type' => 'error',
                    'message' => 'An error occurred while gathering phone API data: ' . $e->getMessage()
                ]
            ], 500);
        }
    }
}
