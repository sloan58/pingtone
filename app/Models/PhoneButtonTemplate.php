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
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'phone_button_templates',
            $rows,
            ['ucm_id', 'name'],
            null,
            1000,
            ['name' => 1, 'ucm_id' => 1]
        );
    }

    /**
     * Store detailed phone button template data from SQL response rows
     */
    public static function storeButtonTemplateDetails(array $rows, Ucm $ucm): void
    {
        // Minimal processing: group rows by template name and collapse button rows
        $grouped = collect($rows)->groupBy(fn($r) => $r['templatename']);

        $docs = $grouped->map(function ($groupRows, $templateName) use ($ucm) {
            $first = $groupRows[0];
            $buttons = collect($groupRows)->map(fn($item) => [
                'label' => $item['label'] ?? null,
                'buttonNumber' => $item['buttonnum'] ?? null,
                'feature' => $item['feature'] ?? null,
            ])->values()->toArray();

            return [
                'ucm_id' => $ucm->id,
                'name' => $templateName,
                'model' => $first['model'] ?? null,
                'protocol' => $first['protocol'] ?? null,
                'buttons' => $buttons,
            ];
        })->values()->all();

        MongoBulkUpsert::upsert(
            'phone_button_templates',
            $docs,
            ['ucm_id', 'name'],
            null,
            1000,
            ['name' => 1, 'ucm_id' => 1]
        );
    }
}


