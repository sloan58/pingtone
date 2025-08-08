<?php

namespace App\Models;

use DB;
use Exception;
use MongoDB\BSON\UTCDateTime;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneModel extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'name',
        'maxExpansionModules',
        'supportedExpansionModules',
        'ucm_id',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
//        'supportedExpansionModules' => 'array',
    ];

    /**
     * The relationships that should always be loaded.
     */
    protected $with = ['ucm'];

    /**
     * Get the UCM that owns this phone model.
     */
    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Store UCM data from AXL response
     *
     * @param array $responseData
     * @param Ucm $ucm
     * @return void
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $collection = DB::connection('mongodb')->getCollection('phone_models');

        foreach ($responseData as $record) {
            $update = [
                'name' => $record->name,
                'ucm_id' => $ucm->id,
                'updated_at' => new UTCDateTime(now())
            ];

            $filter = [
                'ucm_id' => $ucm->id,
                'name' => $record->name
            ];

            try {
                $collection->updateOne($filter, ['$set' => $update], [
                    'upsert' => true,
                    'hint' => ['ucm_id' => 1, 'name' => 1]
                ]);
            } catch (Exception $e) {
                logger()->error("Error storing PhoneModel data", [
                    'ucm' => $ucm->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Store supported expansion module data from AXL response
     *
     * @param array $responseData
     * @param Ucm $ucm
     * @return void
     */
    public static function storeSupportedExpansionModuleData(array $responseData, Ucm $ucm): void
    {
        // Group the data by model
        $groupedData = collect($responseData)->groupBy('model');

        foreach ($groupedData as $model => $rows) {
            $expansionModules = $rows->pluck('module')->toArray();

            try {
                $phoneModel = self::where('ucm_id', $ucm->id)
                    ->where('name', $model)
                    ->first();

                if ($phoneModel) {
                    $phoneModel->fill(['supportedExpansionModules' => $expansionModules]);
                    $phoneModel->save();
                }
            } catch (Exception $e) {
                logger()->error("Error storing supported expansion module data", [
                    'ucm' => $ucm->name,
                    'model' => $model,
                    'expansionModules' => $expansionModules,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Store maximum expansion module data from AXL response
     *
     * @param array $responseData
     * @param Ucm $ucm
     * @return void
     */
    public static function storeMaxExpansionModuleData(array $responseData, Ucm $ucm): void
    {
        foreach ($responseData as $record) {
            info('em data', [$record->max]);
            try {
                self::where('ucm_id', $ucm->id)
                    ->where('name', $record->model)
                    ->first()?->update(['maxExpansionModules' => $record->max]);
            } catch (Exception $e) {
                logger()->error("Error storing max expansion module data", [
                    'ucm' => $ucm->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}
