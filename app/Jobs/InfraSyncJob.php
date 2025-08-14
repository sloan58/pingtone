<?php

namespace App\Jobs;

use Exception;
use SoapFault;
use App\Models\Ucm;
use App\Models\UcmUser;
use App\Models\UcmRole;
use App\Models\Location;
use App\Models\AarGroup;
use App\Models\LineGroup;
use App\Models\DevicePool;
use App\Models\SipProfile;
use App\Models\PhoneModel;
use App\Models\UserLocale;
use App\Models\GeoLocation;
use App\Models\SipDialRules;
use Illuminate\Bus\Queueable;
use Illuminate\Bus\Batchable;
use App\Models\PresenceGroup;
use App\Models\ServiceProfile;
use App\Models\RoutePartition;
use App\Models\MohAudioSource;
use App\Models\CallPickupGroup;
use App\Models\SoftkeyTemplate;
use App\Models\RecordingProfile;
use App\Models\VoicemailProfile;
use App\Models\CommonPhoneConfig;
use App\Models\CallingSearchSpace;
use App\Models\CommonDeviceConfig;
use App\Models\PhoneButtonTemplate;
use Illuminate\Support\Facades\Log;
use App\Models\PhoneSecurityProfile;
use App\Models\MediaResourceGroupList;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use App\Models\ExternalCallControlProfile;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

class InfraSyncJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, Batchable;

    public function __construct(
        protected Ucm    $ucm,
        protected string $type
    )
    {
    }

    /**
     * @throws SoapFault
     * @throws Exception
     */
    public function handle(): void
    {
        $axlApi = $this->ucm->axlApi();
        $start = now();

        switch ($this->type) {
            case 'recording_profiles':
                $data = $axlApi->listUcmObjects('listRecordingProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'recordingProfile');
                RecordingProfile::storeUcmData($data, $this->ucm);
                $this->ucm->recordingProfiles()->where('updated_at', '<', $start)->delete();
                break;

            case 'voicemail_profiles':
                $data = $axlApi->listUcmObjects('listVoicemailProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'voiceMailProfile');
                VoicemailProfile::storeUcmData($data, $this->ucm);
                $this->ucm->voicemailProfiles()->where('updated_at', '<', $start)->delete();
                break;

            case 'phone_models':
                $data = $axlApi->performSqlQuery('SELECT name FROM typemodel WHERE tkclass = 1');
                PhoneModel::storeUcmData($data, $this->ucm);
                $this->ucm->phoneModels()->where('updated_at', '<', $start)->delete();
                // expansion modules
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
                $this->ucm->phoneModels()->where('updated_at', '<', $start)->delete();
                // max modules
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
                break;

            case 'softkey_templates':
                $data = $axlApi->listUcmObjects('listSoftKeyTemplate', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'softKeyTemplate');
                SoftkeyTemplate::storeUcmData($data, $this->ucm);
                $this->ucm->softkeyTemplates()->where('updated_at', '<', $start)->delete();
                break;

            case 'route_partitions':
                $data = $axlApi->listUcmObjects('listRoutePartition', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'partitionUsage' => '', 'uuid' => ''],
                ], 'routePartition');
                RoutePartition::storeUcmData($data, $this->ucm);
                $this->ucm->routePartitions()->where('updated_at', '<', $start)->delete();
                break;

            case 'calling_search_spaces':
                $data = $axlApi->listUcmObjects('listCss', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'css');
                CallingSearchSpace::storeUcmData($data, $this->ucm);
                $this->ucm->callingSearchSpaces()->where('updated_at', '<', $start)->delete();
                break;

            case 'device_pools':
                $data = $axlApi->listUcmObjects('listDevicePool', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'devicePool');
                DevicePool::storeUcmData($data, $this->ucm);
                $this->ucm->devicePools()->where('updated_at', '<', $start)->delete();
                break;

            case 'external_call_control_profiles':
                $data = $axlApi->listUcmObjects('listExternalCallControlProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'externalCallControlProfile');
                ExternalCallControlProfile::storeUcmData($data, $this->ucm);
                $this->ucm->externalCallControlProfiles()->where('updated_at', '<', $start)->delete();
                break;

            case 'service_profiles':
                $data = $axlApi->listUcmObjects('listServiceProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'serviceProfile');
                ServiceProfile::storeUcmData($data, $this->ucm);
                $this->ucm->serviceProfiles()->where('updated_at', '<', $start)->delete();
                break;

            case 'sip_profiles':
                $data = $axlApi->listUcmObjects('listSipProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'sipProfile');
                SipProfile::storeUcmData($data, $this->ucm);
                $this->ucm->sipProfiles()->where('updated_at', '<', $start)->delete();
                break;

            case 'locations':
                $data = $axlApi->listUcmObjects('listLocation', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'location');
                Location::storeUcmData($data, $this->ucm);
                $this->ucm->locations()->where('updated_at', '<', $start)->delete();
                break;

            case 'media_resource_group_lists':
                $data = $axlApi->listUcmObjects('listMediaResourceList', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'mediaResourceList');
                MediaResourceGroupList::storeUcmData($data, $this->ucm);
                $this->ucm->mediaResourceGroupLists()->where('updated_at', '<', $start)->delete();
                break;

            case 'moh_audio_sources':
                $audioSources = $axlApi->listUcmObjects('listMohAudioSource', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'sourceId' => ''],
                ], 'mohAudioSource');
                foreach ($audioSources as $audioSource) {
                    try {
                        MohAudioSource::storeUcmDetails($axlApi->getMohAudioSourceBySourceId($audioSource['sourceId']), $this->ucm);
                    } catch (Exception $e) {
                        Log::warning("{$this->ucm->name}: get MOH audio source failed: {$audioSource['name']} - {$e->getMessage()}");
                    }
                }
                $this->ucm->mohAudioSources()->where('updated_at', '<', $start)->delete();
                break;

            case 'call_pickup_groups':
                $data = $axlApi->listUcmObjects('listCallPickupGroup', [
                    'searchCriteria' => ['pattern' => '%'],
                    'returnedTags' => [
                        'name' => '', 'pattern' => '', 'routePartitionName' => '', 'description' => ''
                    ],
                ], 'callPickupGroup');
                CallPickupGroup::storeUcmData($data, $this->ucm);
                $this->ucm->callPickupGroups()->where('updated_at', '<', $start)->delete();
                break;

            case 'common_phone_configs':
                $data = $axlApi->listUcmObjects('listCommonPhoneConfig', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'commonPhoneConfig');
                CommonPhoneConfig::storeUcmData($data, $this->ucm);
                $this->ucm->commonPhoneConfigs()->where('updated_at', '<', $start)->delete();
                break;

            case 'common_device_configs':
                $data = $axlApi->listUcmObjects('listCommonDeviceConfig', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'commonDeviceConfig');
                CommonDeviceConfig::storeUcmData($data, $this->ucm);
                $this->ucm->commonDeviceConfigs()->where('updated_at', '<', $start)->delete();
                break;

            case 'line_groups':
                $data = $axlApi->listUcmObjects('listLineGroup', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => ''],
                ], 'lineGroup');
                foreach ($data as $lg) {
                    try {
                        LineGroup::storeUcmDetails($axlApi->getLineGroupByName($lg['name']), $this->ucm);
                    } catch (Exception $e) {
                        Log::warning("{$this->ucm->name}: get line group failed: {$lg['name']} - {$e->getMessage()}");
                    }
                }
                $this->ucm->lineGroups()->where('updated_at', '<', $start)->delete();
                break;

            case 'ucm_users':
                // Sync end users
                $users = $axlApi->listUcmObjects('listUser', [
                    'searchCriteria' => ['userid' => '%'],
                    'returnedTags' => ['userid' => ''],
                ], 'user');
                foreach ($users as $user) {
                    try {
                        UcmUser::storeUcmDetails($axlApi->getUserByUserId($user['userid']), $this->ucm, 'enduser');
                    } catch (Exception $e) {
                        Log::warning("{$this->ucm->name}: get user failed: {$user['userid']} - {$e->getMessage()}");
                    }
                }

                // Sync application users
                $appUsers = $axlApi->listUcmObjects('listAppUser', [
                    'searchCriteria' => ['userid' => '%'],
                    'returnedTags' => ['userid' => ''],
                ], 'appUser');
                foreach ($appUsers as $appUser) {
                    try {
                        UcmUser::storeUcmDetails($axlApi->getAppUserByUserId($appUser['userid']), $this->ucm, 'appuser');
                    } catch (Exception $e) {
                        Log::warning("{$this->ucm->name}: get app user failed: {$appUser['userid']} - {$e->getMessage()}");
                    }
                }
                $this->ucm->ucmUsers()->where('updated_at', '<', $start)->delete();
                break;

            case 'phone_button_templates':
                $data = $axlApi->listUcmObjects('listPhoneButtonTemplate', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'phoneButtonTemplate');
                PhoneButtonTemplate::storeUcmData($data, $this->ucm);

                // Sync Phone Button Template Protocol and Model info via SQL
                $templateProtocolModelInfo = $axlApi->performSqlQuery(
                    'SELECT t.name templatename, m.name model, p.name protocol
                         FROM phonetemplate t
                         JOIN typemodel m ON t.tkmodel = m.enum
                         JOIN typedeviceprotocol p ON t.tkdeviceprotocol = p.enum'
                );
                PhoneButtonTemplate::storeTemplateProtocolModelInfo($templateProtocolModelInfo, $this->ucm);
                Log::info("{$this->ucm->name}: syncPhoneButtonTemplateProtocolModelInfo completed");

                // Sync Phone Button Template Button Details via SQL
                $buttonDetails = $axlApi->performSqlQuery(
                    'SELECT pb.buttonnum, pb.label, f.name feature, t.name templatename
                         FROM phonebutton pb
                         JOIN typefeature f ON f.enum = pb.tkfeature
                         JOIN phonetemplate t ON pb.fkphonetemplate = t.pkid
                         ORDER BY pb.fkphonetemplate, pb.buttonnum'
                );
                PhoneButtonTemplate::storeButtonTemplateDetails($buttonDetails, $this->ucm);
                Log::info("{$this->ucm->name}: syncPhoneButtonTemplateDetails completed");

                $this->ucm->phoneButtonTemplates()->where('updated_at', '<', $start)->delete();
                break;

            case 'ucm_roles':
                $roles = $axlApi->performSqlQuery('select pkid as uuid, name FROM dirgroup');
                UcmRole::storeUcmData($roles, $this->ucm);
                $this->ucm->roles()->where('updated_at', '<', $start)->delete();
                break;

            case 'aar_groups':
                $data = $axlApi->listUcmObjects('listAarGroup', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'aarGroup');
                AarGroup::storeUcmData($data, $this->ucm);
                $this->ucm->aarGroups()->where('updated_at', '<', $start)->delete();
                break;

            case 'user_locales':
                $data = $axlApi->performSqlQuery('SELECT * FROM typeuserlocale');
                UserLocale::storeUcmData($data, $this->ucm);
                $this->ucm->userLocales()->where('updated_at', '<', $start)->delete();
                break;

            case 'geo_locations':
                $data = $axlApi->listUcmObjects('listGeoLocation', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'geoLocation');
                GeoLocation::storeUcmData($data, $this->ucm);
                $this->ucm->geoLocations()->where('updated_at', '<', $start)->delete();
                break;

            case 'presence_groups':
                $data = $axlApi->listUcmObjects('listPresenceGroup', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'presenceGroup');
                PresenceGroup::storeUcmData($data, $this->ucm);
                $this->ucm->presenceGroups()->where('updated_at', '<', $start)->delete();
                break;

            case 'sip_dial_rules':
                $data = $axlApi->listUcmObjects('listSipDialRules', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => ''],
                ], 'sipDialRules');
                SipDialRules::storeUcmData($data, $this->ucm);
                $this->ucm->sipDialRules()->where('updated_at', '<', $start)->delete();
                break;

            case 'phone_security_profiles':
                $data = $axlApi->listUcmObjects('listPhoneSecurityProfile', [
                    'searchCriteria' => ['name' => '%'],
                    'returnedTags' => ['name' => '', 'uuid' => '', 'phoneType' => ''],
                ], 'phoneSecurityProfile');
                PhoneSecurityProfile::storeUcmData($data, $this->ucm);
                $this->ucm->phoneSecurityProfiles()->where('updated_at', '<', $start)->delete();
                break;
        }
    }
}


