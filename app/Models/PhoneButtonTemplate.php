<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneButtonTemplate extends Model
{
    protected $fillable = [
        'uuid',
        'name',
        'ucm_id',
        'pkid',
        'model',
        'protocol',
        'buttons',
    ];

    protected $with = ['ucm'];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        foreach (array_chunk($responseData, 1000) as $chunk) {
            $rows = array_map(fn($record) => [
                'uuid' => $record->uuid,
                'name' => $record->name,
                'ucm_id' => $ucm->id,
            ], $chunk);

            MongoBulkUpsert::upsert(
                'phone_button_templates',
                $rows,
                ['ucm_id', 'name'],
                ['uuid', 'name', 'ucm_id'],
                1000,
                ['name' => 1, 'ucm_id' => 1]
            );
        }
    }

    /**
     * Store detailed phone button template data from SQL response rows
     */
    public static function storeButtonTemplateDetails(array $rows, Ucm $ucm): void
    {
        // Normalize to arrays
        $rows = array_map(function ($r) {
            return is_array($r) ? $r : (array)$r;
        }, $rows);

        // Group by template (prefer pkid if present, else name)
        $grouped = collect($rows)->groupBy(fn($r) => $r['templatepkid'] ?? $r['templatename']);

        foreach ($grouped->chunk(1000) as $chunk) {
            $docs = $chunk->map(function ($groupRows, $templateKey) use ($ucm) {
                $first = $groupRows[0];
                $buttons = collect($groupRows)->map(function ($item) {
                    return [
                        'label' => $item['label'] ?? null,
                        'buttonNumber' => $item['buttonnum'] ?? null,
                        'feature' => $item['feature'] ?? null,
                    ];
                })->values()->toArray();

                return [
                    'ucm_id' => $ucm->id,
                    'name' => $first['templatename'] ?? null,
                    'pkid' => $first['templatepkid'] ?? null,
                    'model' => $first['model'] ?? null,
                    'protocol' => $first['protocol'] ?? null,
                    'buttons' => $buttons,
                ];
            })->values()->toArray();

            // Upsert on (ucm_id, name) to align with existing unique index
            MongoBulkUpsert::upsert(
                'phone_button_templates',
                $docs,
                ['ucm_id', 'name'],
                ['name', 'pkid', 'model', 'protocol', 'buttons', 'ucm_id'],
                1000,
                ['name' => 1, 'ucm_id' => 1]
            );
        }
    }
}


