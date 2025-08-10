<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UcmRole extends Model
{
    protected $guarded = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    public static function storeUcmData(array $rows, Ucm $ucm): void
    {
        $docs = array_map(fn($row) => [
            'pkid' => $row['pkid'] ?? null,
            'name' => $row['name'] ?? null,
            'ucm_id' => $ucm->id,
        ], $rows);

        MongoBulkUpsert::upsert(
            'ucm_roles',
            $docs,
            ['ucm_id', 'pkid'],
            ['ucm_id' => 1, 'pkid' => 1]
        );
    }
}


