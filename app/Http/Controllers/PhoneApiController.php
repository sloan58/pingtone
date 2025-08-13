<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Phone;
use App\Services\PhoneApi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PhoneApiController extends Controller
{
    /**
     * Gather API data for a specific phone
     *
     * @param Request $request
     * @param string $phoneId
     * @return \Illuminate\Http\RedirectResponse
     */
    public function gatherData(Request $request, string $phoneId)
    {
        try {
            $phone = Phone::findOrFail($phoneId);

            $phoneApi = new PhoneApi();
            $result = $phoneApi->gatherPhoneData($phone);

            $phone->update([
                'api_data' => $result['api_data']
            ]);

            if ($result['success']) {
                Log::info("Successfully gathered and stored phone API data", [
                    'phone' => $phone->name,
                    'ucm' => $phone->ucm->name,
                    'has_network_data' => !empty($result['api_data']['network']),
                    'has_config_data' => !empty($result['api_data']['config']),
                ]);

                return redirect()->back()->with('toast', [
                    'type' => 'success',
                    'title' => 'Phone API data gathered successfully',
                    'message' => sprintf(
                        'Network: %s, Config: %s',
                        !empty($result['api_data']['network']) ? '✓' : '✗',
                        !empty($result['api_data']['config']) ? '✓' : '✗'
                    ),
                ]);
            } else {
                Log::warning("Failed to gather phone API data", [
                    'phone' => $phone->name,
                    'ucm' => $phone->ucm->name,
                    'error' => $result['error'],
                ]);

                return redirect()->back()->with('toast', [
                    'type' => 'error',
                    'title' => 'Failed to gather phone API data',
                    'message' => $result['error'],
                ]);
            }

        } catch (Exception $e) {
            Log::error("Error in phone API data gathering", [
                'phone_id' => $phoneId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('toast', [
                'type' => 'error',
                'title' => 'Error gathering phone API data',
                'message' => $e->getMessage(),
            ]);
        }
    }
}
