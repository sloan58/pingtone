<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use Exception;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use MongoDB\Laravel\Eloquent\Model;

class PhoneButtonTemplate extends Model
{
    protected $guarded = [];

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
            'phone_button_templates',
            $rows,
            ['ucm_cluster_id', 'name'],
            ['name' => 1, 'ucm_cluster_id' => 1]
        );
    }

    /**
     * Store detailed phone button template data from SQL response rows
     */
    public static function storeButtonTemplateDetails(array $responseData, UcmCluster $ucmCluster): void
    {
        collect($responseData)->groupBy('templatename')->each(function($record, $key) use ($ucmCluster) {
            try {
                self::where('ucm_cluster_id', $ucmCluster->id)
                    ->where('name', $key)
                    ->first()?->update(['buttons' => $record->toArray()]);
            } catch (Exception $e) {
                logger()->error("Error updating phone button template button data", [
                    'ucm' => $ucmCluster->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        });
    }

    /**
     * Store phone button template protocol and model information from SQL response rows
     */
    public static function storeTemplateProtocolModelInfo(array $responseData, UcmCluster $ucmCluster): void
    {
        collect($responseData)->each(function($record) use ($ucmCluster) {
            try {
                self::where('ucm_cluster_id', $ucmCluster->id)
                    ->where('name', $record['templatename'])
                    ->first()?->update([
                        'model' => $record['model'],
                        'protocol' => $record['protocol'],
                    ]);
            } catch (Exception $e) {
                logger()->error("Error updating phone button template protocol/model info", [
                    'ucm' => $ucmCluster->name,
                    'template' => $record['templatename'],
                    'message' => $e->getMessage(),
                ]);
            }
        });
    }
}


