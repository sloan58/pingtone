<?php

namespace App\Models;

use Exception;
use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneButtonTemplate extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'phone_button_templates',
            $rows,
            ['ucm_id', 'name'],
            ['name' => 1, 'ucm_id' => 1]
        );
    }

    /**
     * Store detailed phone button template data from SQL response rows
     */
    public static function storeButtonTemplateDetails(array $responseData, Ucm $ucm): void
    {
        collect($responseData)->groupBy('templatename')->each(function($record, $key) use ($ucm) {
            try {
                self::where('ucm_id', $ucm->id)
                    ->where('name', $key)
                    ->first()?->update(['buttons' => $record->toArray()]);
            } catch (Exception $e) {
                logger()->error("Error updating phone button template button data", [
                    'ucm' => $ucm->name,
                    'record' => $record,
                    'message' => $e->getMessage(),
                ]);
            }
        });
    }
}


