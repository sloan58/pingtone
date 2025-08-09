<?php

namespace App\Models;

use Exception;
use App\Support\MongoBulkUpsert;
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
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'phone_models',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
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
                self::where('ucm_id', $ucm->id)
                    ->where('name', $model)
                    ->first()?->update(['supportedExpansionModules' => $expansionModules]);
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
