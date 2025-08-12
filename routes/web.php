<?php

use App\Http\Controllers\UcmController;
use App\Http\Controllers\PhoneController;
use App\Http\Controllers\InfrastructureOptionsController;
use App\Http\Controllers\SyncHistoryController;
use App\Http\Controllers\DashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

Route::middleware('auth')->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('ucm', UcmController::class)->except(['show']);
    Route::resource('phones', PhoneController::class)->only(['index', 'show', 'edit', 'update']);
    
    // UCM API test route
    Route::post('/ucm/{ucm}/test-connection', [UcmController::class, 'testConnection'])->name('ucm.test-connection');
    
    // Sync History routes
    Route::get('/ucm/{ucm}/sync-history', [SyncHistoryController::class, 'index'])->name('ucm.sync-history');
    Route::post('/ucm/{ucm}/sync', [SyncHistoryController::class, 'startSync'])->name('ucm.sync.start');
    Route::patch('/sync-history/{syncHistory}/complete', [SyncHistoryController::class, 'completeSync'])->name('sync-history.complete');
    Route::patch('/sync-history/{syncHistory}/fail', [SyncHistoryController::class, 'failSync'])->name('sync-history.fail');
    

});

// Infrastructure options (scoped by UCM)
Route::middleware('auth')->prefix('api')->group(function () {
    Route::get('/ucm/{ucm}/options/device-pools', [InfrastructureOptionsController::class, 'devicePools']);
    Route::get('/ucm/{ucm}/options/phone-models', [InfrastructureOptionsController::class, 'phoneModels']);
    Route::get('/ucm/{ucm}/options/phones', [InfrastructureOptionsController::class, 'phones']);
    Route::get('/ucm/{ucm}/options/common-device-configs', [InfrastructureOptionsController::class, 'commonDeviceConfigs']);
    Route::get('/ucm/{ucm}/options/phone-button-templates', [InfrastructureOptionsController::class, 'phoneButtonTemplates']);
    Route::get('/ucm/{ucm}/options/common-phone-configs', [InfrastructureOptionsController::class, 'commonPhoneConfigs']);
    Route::get('/ucm/{ucm}/options/calling-search-spaces', [InfrastructureOptionsController::class, 'callingSearchSpaces']);
    Route::get('/ucm/{ucm}/options/locations', [InfrastructureOptionsController::class, 'locations']);
    Route::get('/ucm/{ucm}/options/media-resource-group-lists', [InfrastructureOptionsController::class, 'mediaResourceGroupLists']);
    Route::get('/ucm/{ucm}/options/moh-audio-sources', [InfrastructureOptionsController::class, 'mohAudioSources']);
    Route::get('/ucm/{ucm}/options/aar-groups', [InfrastructureOptionsController::class, 'aarGroups']);
    Route::get('/ucm/{ucm}/options/user-locales', [InfrastructureOptionsController::class, 'userLocales']);
    Route::get('/ucm/{ucm}/options/ucm-users', [InfrastructureOptionsController::class, 'ucmUsers']);
    Route::get('/ucm/{ucm}/options/mobility-users', [InfrastructureOptionsController::class, 'mobilityUsers']);
    Route::get('/ucm/{ucm}/options/geo-locations', [InfrastructureOptionsController::class, 'geoLocations']);
    Route::get('/ucm/{ucm}/options/presence-groups', [InfrastructureOptionsController::class, 'presenceGroups']);
    Route::get('/ucm/{ucm}/options/sip-dial-rules', [InfrastructureOptionsController::class, 'sipDialRules']);
    Route::get('/ucm/{ucm}/options/phone-security-profiles', [InfrastructureOptionsController::class, 'phoneSecurityProfiles']);
    Route::get('/ucm/{ucm}/options/sip-profiles', [InfrastructureOptionsController::class, 'sipProfiles']);
    Route::get('/ucm/{ucm}/options/device-profiles', [InfrastructureOptionsController::class, 'deviceProfiles']);
    Route::get('/ucm/{ucm}/options/extension-mobility-dynamic', [InfrastructureOptionsController::class, 'extensionMobilityDynamic']);
});

Route::get('/test-toast', function () {
    return redirect()->route('ucm.index')
        ->with('toast', [
            'type' => 'success',
            'title' => 'Test Toast',
            'message' => 'This is a test toast notification to verify the system is working.'
        ]);
})->name('test.toast');

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
