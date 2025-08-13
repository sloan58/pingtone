<?php

namespace App\Services;

use Log;
use Exception;
use App\Models\Phone;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use App\Models\PhoneScreenCapture;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class PhoneScreenCaptureService
{
    private bool $phoneViewError = false;

    /**
     * Capture a screenshot from the phone and save it.
     * @throws Exception
     */
    public function captureScreenshot(Phone $phone): PhoneScreenCapture
    {
        // Check if phone can perform screen capture
        if (!$phone->canScreenCapture()) {
            throw new Exception('Phone does not support screen capture or is not properly configured.');
        }

        // Validate phone has required properties
        if (!$phone->currentIpAddress) {
            throw new Exception('Phone does not have a valid IP address.');
        }

        if (!$phone->ucm || !$phone->ucm->username || !$phone->ucm->password) {
            throw new Exception('Phone UCM credentials are not configured.');
        }

        // Assign phone to app user if needed
        $this->assignPhoneToAppUser($phone);

        if ($this->phoneViewError) {
            throw new Exception('Failed to associate user with phone for screen capture.');
        }

        // Create the storage directory for this phone
        $phoneDir = "phone-captures/{$phone->_id}";
        Storage::disk('public')->makeDirectory($phoneDir);

        // Generate filename with timestamp
        $filename = 'capture_' . now()->format('Y-m-d_H-i-s') . '.png';
        $filePath = "{$phoneDir}/{$filename}";

        try {
            // Make HTTP request to phone's screenshot endpoint and get base64 encoded response
            $response = Http::timeout(15)
                ->withBasicAuth($phone->ucm->username, $phone->ucm->password)
                ->withHeaders([
                    'Accept' => 'application/octet-stream',
                    'User-Agent' => 'PingTone/1.0',
                ])
                ->get("http://{$phone->currentIpAddress}/CGI/Screenshot");

            if (!$response->successful()) {
                $statusCode = $response->status();
                if ($statusCode === 401) {
                    throw new Exception('Authentication failed. Please check UCM credentials.');
                } elseif ($statusCode === 404) {
                    throw new Exception('Screenshot endpoint not found. Phone may not support screen capture.');
                } else {
                    throw new Exception("Failed to capture screenshot. HTTP status: {$statusCode}");
                }
            }

            // Convert response body to base64 and save to file
            $base64Image = base64_encode($response->body());
            Storage::disk('public')->put($filePath, base64_decode($base64Image));

            // Verify the file was created and has content
            if (!Storage::disk('public')->exists($filePath)) {
                throw new Exception('Failed to save screenshot to storage.');
            }

            $fileSize = Storage::disk('public')->size($filePath);
            if ($fileSize === 0) {
                Storage::disk('public')->delete($filePath);
                throw new Exception('Screenshot file is empty.');
            }

            // Create database record
            $screenCapture = PhoneScreenCapture::create([
                'phone_id' => $phone->_id,
                'filename' => $filename,
                'file_path' => $filePath,
                'file_size' => $fileSize,
                'mime_type' => 'image/png',
                'captured_at' => now(),
            ]);

            Log::info('Phone screen capture successful', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'filename' => $filename,
                'file_size' => $screenCapture->file_size,
            ]);

            return $screenCapture;

        } catch (Exception $e) {
            Log::error('Phone screen capture failed', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'ip_address' => $phone->currentIpAddress,
                'error' => $e->getMessage(),
            ]);

            // Clean up any partial files
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            throw $e;
        }
    }

    /**
     * Assign phone to app user for screen capture access
     */
    private function assignPhoneToAppUser(Phone $phone): void
    {
        // Check if user is already associated with the phone
        $ucmUser = $phone->ucm->ucmUsers()
            ->where('userid', $phone->ucm->username)
            ->first();

        if ($ucmUser && isset($ucmUser->associatedDevices['device'])) {
            $deviceList = Arr::wrap($ucmUser->associatedDevices['device']);
            if (in_array($phone->name, $deviceList)) {
                Log::info('User already associated with phone for screen capture', [
                    'phone_id' => $phone->_id,
                    'phone_name' => $phone->name,
                    'username' => $phone->ucm->username,
                ]);
                return;
            }
        }

        // Wait for any existing phone view operations to complete
        while (Cache::has("phone-view-{$phone->ucm->id}")) {
            sleep(1);
        }

        // Set cache lock to prevent race conditions
        Cache::put("phone-view-{$phone->ucm->id}", true, 30);

        try {
            // Get current associated devices
            $res = $phone->ucm->axlApi()->getAppUser([
                'userid' => $phone->ucm->username,
                'returnedTags' => [
                    'associatedDevices' => ''
                ]
            ]);

            $deviceList = Arr::wrap($res->associatedDevices->device ?? []);
            $deviceList[] = $phone->name;

            // Update user with new device list
            $phone->ucm->axlApi()->updateAppUser([
                'userid' => $phone->ucm->username,
                'associatedDevices' => [
                    'device' => $deviceList
                ]
            ]);

            Log::info('Successfully associated user with phone for screen capture', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'username' => $phone->ucm->username,
            ]);

        } catch (Exception $e) {
            Log::error('Could not assign user for phone view', [
                'phone_id' => $phone->_id,
                'phone_name' => $phone->name,
                'username' => $phone->ucm->username,
                'line' => $e->getLine(),
                'message' => $e->getMessage(),
            ]);
            $this->phoneViewError = true;
        } finally {
            // Remove cache lock
            Cache::forget("phone-view-{$phone->ucm->id}");

            // Allow user association to propagate
            sleep(1);
        }

    }

    /**
     * Delete a screen capture and its associated file.
     */
    public function deleteScreenCapture(PhoneScreenCapture $screenCapture): bool
    {
        try {
            // Delete the file from storage
            if (Storage::disk('public')->exists($screenCapture->file_path)) {
                Storage::disk('public')->delete($screenCapture->file_path);
            }

            // Delete the database record
            $screenCapture->delete();

            Log::info('Phone screen capture deleted', [
                'phone_id' => $screenCapture->phone_id,
                'filename' => $screenCapture->filename,
            ]);

            return true;

        } catch (Exception $e) {
            Log::error('Failed to delete phone screen capture', [
                'phone_id' => $screenCapture->phone_id,
                'filename' => $screenCapture->filename,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get all screen captures for a phone, ordered by capture date.
     */
    public function getScreenCaptures(Phone $phone): Collection
    {
        return $phone->screenCaptures()
            ->orderBy('captured_at', 'desc')
            ->get();
    }
}
