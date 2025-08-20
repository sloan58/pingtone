<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use Exception;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class PhoneModel extends Model
{
    protected $guarded = [];

    /**
     * Get the UCM that owns this phone model.
     */
    public function ucmCluster(): BelongsTo
    {
        return $this->belongsTo(UcmCluster::class);
    }

    /**
     * Store UCM data from AXL response
     *
     * @param array $responseData
     * @param UcmCluster $ucmCluster
     * @return void
     */
    public static function storeUcmData(array $responseData, UcmCluster $ucmCluster): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_cluster_id' => $ucmCluster->id], $responseData);

        MongoBulkUpsert::upsert(
            'phone_models',
            $rows,
            ['ucm_cluster_id', 'name'],
            ['name' => 1, 'ucm_cluster_id' => 1]
        );
    }

    /**
     * Store supported expansion module data from AXL response
     *
     * @param array $responseData
     * @param UcmCluster $ucmCluster
     * @return void
     */
    public static function storeSupportedExpansionModuleData(array $responseData, UcmCluster $ucmCluster): void
    {
        // Group the data by model
        $groupedData = collect($responseData)->groupBy('model');

        foreach ($groupedData as $model => $rows) {
            $expansionModules = $rows->pluck('module')->toArray();

            try {
                self::where('ucm_cluster_id', $ucmCluster->id)
                    ->where('name', $model)
                    ->first()?->update(['supportedExpansionModules' => $expansionModules]);
            } catch (Exception $e) {
                logger()->error("Error storing supported expansion module data", [
                    'ucm' => $ucmCluster->name,
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
     * @param UcmCluster $ucmCluster
     * @return void
     */
    public static function storeMaxExpansionModuleData(array $responseData, UcmCluster $ucmCluster): void
    {
        foreach ($responseData as $record) {
            try {
                self::where('ucm_cluster_id', $ucmCluster->id)
                    ->where('name', $record['model'])
                    ->first()?->update(['maxExpansionModules' => $record['max']]);
            } catch (Exception $e) {
                logger()->error("Error storing max expansion module data", [
                    'ucm' => $ucmCluster->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}
