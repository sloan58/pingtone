<?php

namespace App\Jobs;

use Exception;
use App\Models\Ucm;
use App\Models\PhoneApi;
use App\Services\PhoneApi as PhoneApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class GatherPhoneApiDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected Ucm $ucm,
        protected ?array $phones = null
    )
    {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting phone API data gathering for UCM {$this->ucm->name}", [
            'phone_count' => $this->phones ? count($this->phones) : 'all',
        ]);

        try {
            // Get phones to process
            $phonesToProcess = $this->getPhonesToProcess();

            if (empty($phonesToProcess)) {
                Log::info("No phones to process for UCM {$this->ucm->name}");
                return;
            }

            $phoneApiClient = new PhoneApiService();

            // Gather device information and network configuration from phone APIs
            $apiData = $phoneApiClient->gatherPhoneData($phonesToProcess);

            if (empty($apiData)) {
                Log::info("No phone API data received for UCM {$this->ucm->name}");
                return;
            }

            // Store the complete API response data in the timeseries collection
            PhoneApi::storeFromApiData($apiData, $this->ucm);

            // Calculate success statistics
            $successCount = count(array_filter($apiData, fn($record) => $record['success'] ?? false));
            $totalCount = count($apiData);

            Log::info("Successfully gathered and stored phone API data for UCM {$this->ucm->name}", [
                'ucm_id' => $this->ucm->getKey(),
                'total_requests' => $totalCount,
                'successful_requests' => $successCount,
                'failed_requests' => $totalCount - $successCount,
                'success_rate' => $totalCount > 0 ? round(($successCount / $totalCount) * 100, 2) : 0,
            ]);

        } catch (Exception $e) {
            Log::error("Error gathering phone API data for UCM {$this->ucm->name}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ucm_id' => $this->ucm->getKey(),
            ]);

            throw $e;
        }
    }

    /**
     * Get the phones to process for API data gathering
     *
     * @return array
     */
    private function getPhonesToProcess(): array
    {
        if ($this->phones) {
            // Use provided phone list
            return $this->phones;
        }

        // Get all phones for this UCM
        $phones = $this->ucm->phones()
            ->select(['id', 'name', 'ucm_id'])
            ->get()
            ->toArray();

        return $phones;
    }
}
