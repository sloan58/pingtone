<?php

namespace App\Models;

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
        foreach (array_chunk($rows, 1000) as $chunk) {
            $docs = array_map(fn($row) => [
                'pkid' => $row['pkid'],
                'name' => $row['name'],
                'ucm_id' => $ucm->id,
            ], $chunk);

            \DB::connection('mongodb')->getCollection('ucm_roles')->bulkWrite(
                array_map(function ($doc) {
                    return ['updateOne' => [
                        ['ucm_id' => $doc['ucm_id'], 'pkid' => $doc['pkid']],
                        ['$set' => $doc, '$setOnInsert' => ['created_at' => new \MongoDB\BSON\UTCDateTime(now())]],
                        ['upsert' => true, 'hint' => ['ucm_id' => 1, 'pkid' => 1]],
                    ]];
                }, $docs),
                ['ordered' => false]
            );
        }
    }
}


