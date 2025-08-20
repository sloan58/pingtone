<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DataDictionaryController;
use App\Http\Controllers\InfrastructureOptionsController;
use App\Http\Controllers\LineController;
use App\Http\Controllers\PhoneApiController;
use App\Http\Controllers\PhoneController;
use App\Http\Controllers\ServiceAreaController;
use App\Http\Controllers\SyncHistoryController;
use App\Http\Controllers\UcmClusterController;
use App\Http\Controllers\UcmNodeController;
use App\Http\Controllers\UcmUserController;
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

    // UCM Cluster routes (new cluster-focused routes)
    Route::get('/ucm-clusters/wizard', [UcmClusterController::class, 'wizard'])->name('ucm-clusters.wizard');
    Route::post('/ucm-clusters/discover', [UcmClusterController::class, 'discover'])->name('ucm-clusters.discover');
    Route::post('/ucm-clusters/{ucmCluster}/sql-query', [UcmClusterController::class, 'executeSqlQuery'])->name('ucm-clusters.sql-query');
    
    // Data Dictionary routes
    Route::get('/data-dictionary/versions', [DataDictionaryController::class, 'getAvailableVersions'])->name('data-dictionary.versions');
    Route::get('/ucm-clusters/{ucmCluster}/data-dictionary', [DataDictionaryController::class, 'getDataDictionary'])->name('ucm-clusters.data-dictionary');
    Route::get('/ucm-clusters/{ucmCluster}/data-dictionary/tables/{tableName}', [DataDictionaryController::class, 'getTableDetails'])->name('ucm-clusters.data-dictionary.table');
    Route::get('/ucm-clusters/{ucmCluster}/data-dictionary/search', [DataDictionaryController::class, 'search'])->name('ucm-clusters.data-dictionary.search');
    Route::get('/ucm-clusters/{ucmCluster}/data-dictionary/suggestions', [DataDictionaryController::class, 'getSuggestions'])->name('ucm-clusters.data-dictionary.suggestions');
    
    Route::resource('ucm-clusters', UcmClusterController::class)->except(['edit']);

    // UCM Node routes (for individual node management)
    Route::resource('ucm-nodes', UcmNodeController::class)->only(['index', 'show', 'edit', 'update', 'destroy']);
    Route::resource('phones', PhoneController::class)->only(['index', 'show', 'edit', 'update']);
    Route::resource('lines', LineController::class)->only(['index', 'edit', 'update']);
    Route::resource('ucm-users', UcmUserController::class)->only(['index']);
    Route::resource('service-areas', ServiceAreaController::class)->except(['show']);
    Route::post('/service-areas/trigger-assignment', [ServiceAreaController::class, 'triggerAssignment'])->name('service-areas.trigger-assignment');
    Route::get('/phones/{phone}/edit/button/{buttonIndex}', [PhoneController::class, 'editButton'])->name('phones.edit.button');
    Route::post('/phones/{phone}/lines/{lineIndex}', [PhoneController::class, 'updateLine'])->name('phones.lines.update');



    // Phone screen capture routes
    Route::post('/phones/{phone}/capture-screenshot', [PhoneController::class, 'captureScreenshot'])->name('phones.capture-screenshot');
    Route::delete('/phone-screen-captures/{screenCapture}', [PhoneController::class, 'deleteScreenCapture'])->name('phone-screen-captures.delete');

    // Phone API data gathering
    Route::get('/phones/{phone}/gather-api-data', [PhoneApiController::class, 'gatherData'])->name('phones.gather-api-data');

    // UCM Node API test route
    Route::post('/ucm-nodes/{ucmNode}/test-connection', [UcmNodeController::class, 'testConnection'])->name('ucm-nodes.test-connection');

    // Cluster Sync routes
    Route::post('/ucm-clusters/{ucmCluster}/sync', [SyncHistoryController::class, 'startClusterSync'])->name('ucm-clusters.sync.start');

    // UCM Node Sync History routes (for individual nodes)
    Route::get('/ucm-nodes/{ucmNode}/sync-history', [SyncHistoryController::class, 'index'])->name('ucm-nodes.sync-history');
    Route::post('/ucm-nodes/{ucmNode}/sync', [SyncHistoryController::class, 'startSync'])->name('ucm-nodes.sync.start');
    Route::patch('/sync-history/{syncHistory}/complete', [SyncHistoryController::class, 'completeSync'])->name('sync-history.complete');
    Route::patch('/sync-history/{syncHistory}/fail', [SyncHistoryController::class, 'failSync'])->name('sync-history.fail');


});

// Infrastructure options (scoped by UCM Node)
Route::middleware('auth')->prefix('api')->group(function () {
    Route::get('/ucm-nodes/{ucmNode}/options/device-pools', [InfrastructureOptionsController::class, 'devicePools']);
    Route::get('/ucm-nodes/{ucmNode}/options/external-call-control-profiles', [InfrastructureOptionsController::class, 'externalCallControlProfiles']);
    Route::get('/ucm-nodes/{ucmNode}/options/phone-models', [InfrastructureOptionsController::class, 'phoneModels']);
    Route::get('/ucm-nodes/{ucmNode}/options/phones', [InfrastructureOptionsController::class, 'phones']);
    Route::get('/ucm-nodes/{ucmNode}/options/common-device-configs', [InfrastructureOptionsController::class, 'commonDeviceConfigs']);
    Route::get('/ucm-nodes/{ucmNode}/options/phone-button-templates', [InfrastructureOptionsController::class, 'phoneButtonTemplates']);
    Route::get('/ucm-nodes/{ucmNode}/options/common-phone-configs', [InfrastructureOptionsController::class, 'commonPhoneConfigs']);
    Route::get('/ucm-nodes/{ucmNode}/options/calling-search-spaces', [InfrastructureOptionsController::class, 'callingSearchSpaces']);
    Route::get('/ucm-nodes/{ucmNode}/options/locations', [InfrastructureOptionsController::class, 'locations']);
    Route::get('/ucm-nodes/{ucmNode}/options/media-resource-group-lists', [InfrastructureOptionsController::class, 'mediaResourceGroupLists']);
    Route::get('/ucm-nodes/{ucmNode}/options/moh-audio-sources', [InfrastructureOptionsController::class, 'mohAudioSources']);
    Route::get('/ucm-nodes/{ucmNode}/options/aar-groups', [InfrastructureOptionsController::class, 'aarGroups']);
    Route::get('/ucm-nodes/{ucmNode}/options/user-locales', [InfrastructureOptionsController::class, 'userLocales']);
    Route::get('/ucm-nodes/{ucmNode}/options/ucm-users', [InfrastructureOptionsController::class, 'ucmUsers']);
    Route::get('/ucm-nodes/{ucmNode}/options/mobility-users', [InfrastructureOptionsController::class, 'mobilityUsers']);
    Route::get('/ucm-nodes/{ucmNode}/options/geo-locations', [InfrastructureOptionsController::class, 'geoLocations']);
    Route::get('/ucm-nodes/{ucmNode}/options/presence-groups', [InfrastructureOptionsController::class, 'presenceGroups']);
    Route::get('/ucm-nodes/{ucmNode}/options/sip-dial-rules', [InfrastructureOptionsController::class, 'sipDialRules']);
    Route::get('/ucm-nodes/{ucmNode}/options/phone-security-profiles', [InfrastructureOptionsController::class, 'phoneSecurityProfiles']);
    Route::get('/ucm-nodes/{ucmNode}/options/sip-profiles', [InfrastructureOptionsController::class, 'sipProfiles']);
    Route::get('/ucm-nodes/{ucmNode}/options/device-profiles', [InfrastructureOptionsController::class, 'deviceProfiles']);
    Route::get('/ucm-nodes/{ucmNode}/options/voicemail-profiles', [InfrastructureOptionsController::class, 'voicemailProfiles']);
    Route::get('/ucm-nodes/{ucmNode}/options/route-partitions', [InfrastructureOptionsController::class, 'routePartitions']);
    Route::get('/ucm-nodes/{ucmNode}/options/call-pickup-groups', [InfrastructureOptionsController::class, 'callPickupGroups']);
    Route::get('/ucm-nodes/{ucmNode}/options/extension-mobility-dynamic', [InfrastructureOptionsController::class, 'extensionMobilityDynamic']);

    // Line search and details for async select
    Route::get('/lines/search', [LineController::class, 'search'])->name('lines.search');
    Route::get('/lines/{uuid}', [LineController::class, 'show'])->name('lines.show');

    // Line update API routes
    Route::put('/lines/{uuid}', [LineController::class, 'update'])->name('lines.api.update');

    // Device dissociation from line (supports Phone, DeviceProfile, RemoteDestinationProfile)
    Route::post('/devices/{device_id}/dissociate-line/{line_id}', [PhoneController::class, 'dissociateLine'])->name('devices.dissociate-line');
});

Route::get('/test-toast', function () {
    return redirect()->route('ucm-clusters.index')
        ->with('toast', [
            'type' => 'success',
            'title' => 'Test Toast',
            'message' => 'This is a test toast notification to verify the system is working.'
        ]);
})->name('test.toast');



require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
