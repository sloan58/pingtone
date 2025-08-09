<?php

namespace App\Models;

use App\Support\MongoBulkUpsert;
use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class UcmUser extends Model
{
    protected $fillable = [
        'userid',
        'email',
        'uuid',
    ];

    protected $with = [];

    public function ucm(): BelongsTo
    {
        return $this->belongsTo(Ucm::class);
    }

    /**
     * Store user data and pivot attributes from UCM
     */
    public static function storeUcmData(array $responseData, Ucm $ucm): void
    {
        $rows = array_map(fn($row) => [...$row, 'ucm_id' => $ucm->id], $responseData);

        MongoBulkUpsert::upsert(
            'ucm_users',
            $rows,
            ['uuid', 'ucm_id'],
            ['uuid' => 1, 'ucm_id' => 1]
        );
    }
}


