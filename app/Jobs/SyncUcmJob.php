<?php

namespace App\Jobs;

use Throwable;
use Exception;
use SoapFault;
use App\Models\Ucm;
use App\Models\UcmUser;
use App\Models\PhoneModel;
use App\Models\SyncHistory;
use App\Enums\SyncStatusEnum;
use Illuminate\Bus\Queueable;
use App\Models\SoftkeyTemplate;
use App\Models\RecordingProfile;
use App\Models\VoicemailProfile;
use App\Models\PhoneButtonTemplate;
use Illuminate\Support\Facades\Log;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Contracts\Queue\ShouldQueue;

class SyncUcmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 1;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected Ucm $ucm,
        protected SyncHistory $syncHistory
    ) {}

    /**
     * Execute the job.
     * @throws SoapFault
     */
    public function handle(): void
    {
        Log::info("Starting UCM sync job", [
            'ucm_id' => $this->ucm->id,
            'ucm_name' => $this->ucm->name,
            'sync_history_id' => $this->syncHistory->id,
        ]);

        // Update sync history to show we're starting
        $this->syncHistory->update([
            'status' => SyncStatusEnum::SYNCING,
        ]);

        // Get the AXL API client
        $axlApi = $this->ucm->axlApi();

        // Update version first
        $version = $this->ucm->updateVersionFromApi();

        if (!$version) {
            throw new Exception('Version detection failed');
        }

        // Sync Recording Profiles
        $start = now();
        $recordingProfiles = $axlApi->listUcmObjects(
            'listRecordingProfile',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => '', 'uuid' => ''],
            ],
            'recordingProfile'
        );
        RecordingProfile::storeUcmData($recordingProfiles, $this->ucm);
        $this->ucm->recordingProfiles()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncRecordingProfiles completed");

        // Sync Voicemail Profiles
        $start = now();
        $voicemailProfiles = $axlApi->listUcmObjects(
            'listVoicemailProfile',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => '', 'uuid' => ''],
            ],
            'voiceMailProfile'
        );
        VoicemailProfile::storeUcmData($voicemailProfiles, $this->ucm);
        $this->ucm->voicemailProfiles()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncVoicemailProfiles completed");

        // Sync Phone Models (using SQL query)
        $start = now();
        $phoneModels = $axlApi->performSqlQuery('SELECT name FROM typemodel WHERE tkclass = 1');
        PhoneModel::storeUcmData($phoneModels, $this->ucm);
        $this->ucm->phoneModels()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncPhoneModels completed");

        // Sync Phone Model Expansion Modules
        $expansionModules = $axlApi->performSqlQuery("SELECT DISTINCT tm2.name module, tm.name model
                      FROM typesupportsfeature tsf
                      JOIN productsupportsfeature psf ON psf.tksupportsfeature = tsf.enum
                      JOIN typemodel tm ON tm.enum = psf.tkmodel
                      JOIN typedeviceprotocol tp ON tp.enum = psf.tkdeviceprotocol
                      JOIN productsupportsfeature psf2 ON psf2.param IN (tsf.enum)
                      JOIN typemodel tm2 ON tm2.enum = psf2.tkmodel
                      WHERE tsf.name LIKE '%Expansion%'
                      AND psf2.tksupportsfeature = 86
                      AND tm.name LIKE 'Cisco%'");
        PhoneModel::storeSupportedExpansionModuleData($expansionModules, $this->ucm);
        Log::info("{$this->ucm->name}: syncPhoneModelExpansionModules completed");

        // Sync Phone Model Max Expansion Modules
        $maxExpansionModules = $axlApi->performSqlQuery("SELECT DISTINCT tm.name model, psf.param max
                      FROM typesupportsfeature tsf
                      JOIN productsupportsfeature psf ON psf.tksupportsfeature = tsf.enum
                      JOIN typemodel tm ON tm.enum = psf.tkmodel
                      JOIN typedeviceprotocol tp ON tp.enum = psf.tkdeviceprotocol
                      JOIN productsupportsfeature psf2 ON psf2.param IN (tsf.enum)
                      JOIN typemodel tm2 ON tm2.enum = psf2.tkmodel
                      WHERE tsf.name LIKE '%Expansion%'
                      AND psf2.tksupportsfeature = 86
                      AND psf.param != ''
                      AND tm.name LIKE 'Cisco%'");
        PhoneModel::storeMaxExpansionModuleData($maxExpansionModules, $this->ucm);
        Log::info("{$this->ucm->name}: syncPhoneModelMaxExpansionModule completed");

        // Sync Phone Button Template Details via SQL
        $start = now();
        $templateDetails = $axlApi->performSqlQuery(
            'SELECT pb.buttonnum, pb.fkphonetemplate templatepkid, pb.label, f.name feature, t.name templatename, m.name model, p.name protocol
             FROM phonebutton pb
             JOIN typefeature f ON f.enum = pb.tkfeature
             JOIN phonetemplate t ON pb.fkphonetemplate = t.pkid
             JOIN typemodel m ON t.tkmodel = m.enum
             JOIN typedeviceprotocol p ON t.tkdeviceprotocol = p.enum
             ORDER BY pb.fkphonetemplate'
        );
        PhoneButtonTemplate::storeButtonTemplateDetails($templateDetails, $this->ucm);
        Log::info("{$this->ucm->name}: syncPhoneButtonTemplateDetails completed");

        // Sync Softkey Templates
        $start = now();
        $softkeyTemplates = $axlApi->listUcmObjects(
            'listSoftKeyTemplate',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => '', 'uuid' => ''],
            ],
            'softKeyTemplate'
        );
        SoftkeyTemplate::storeUcmData($softkeyTemplates, $this->ucm);
        $this->ucm->softkeyTemplates()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncSoftkeyTemplates completed");

        // Sync UCM Users
        $start = now();
        $users = $axlApi->listUcmObjects(
            'listUser',
            [
                'searchCriteria' => ['userid' => '%'],
                'returnedTags' => [
                    'uuid' => '',
                    'userid' => '',
                    'mailid' => '',
                    'homeCluster' => '',
                    'imAndPresenceEnable' => '',
                ],
            ],
            'user'
        );
        UcmUser::storeUcmData($users, $this->ucm);
        $this->ucm->ucmUsers()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncUcmUsers completed");

        // Sync Phone Button Templates
        $start = now();
        $phoneButtonTemplates = $axlApi->listUcmObjects(
            'listPhoneButtonTemplate',
            [
                'searchCriteria' => ['name' => '%'],
                'returnedTags' => ['name' => '', 'uuid' => ''],
            ],
            'phoneButtonTemplate'
        );
        PhoneButtonTemplate::storeUcmData($phoneButtonTemplates, $this->ucm);
        $this->ucm->phoneButtonTemplates()->where('updated_at', '<', $start)->delete();
        Log::info("{$this->ucm->name}: syncPhoneButtonTemplates completed");

        Log::info("UCM sync completed successfully", [
            'ucm_id' => $this->ucm->id,
            'version' => $version,
        ]);

        // Mark sync as completed
        $this->syncHistory->update([
            'sync_end_time' => now(),
            'status' => SyncStatusEnum::COMPLETED,
        ]);

        // Update UCM's last sync time
        $this->ucm->update([
            'last_sync_at' => now(),
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        Log::error("UCM sync job failed permanently", [
            'ucm_id' => $this->ucm->id,
            'error' => $exception->getMessage(),
        ]);

        // Ensure sync history is marked as failed
        $this->syncHistory->update([
            'sync_end_time' => now(),
            'status' => SyncStatusEnum::FAILED,
            'error' => $exception->getMessage(),
        ]);
    }
}
