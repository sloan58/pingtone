<?php

namespace App\Support;

use MongoDB\BSON\UTCDateTime;
use Illuminate\Support\Facades\DB;

class MongoBulkUpsert
{
    /**
     * Perform a bulk upsert on a MongoDB collection in chunks.
     *
     * @param string $collectionName
     * @param array $rows Array of arrays or objects containing data
     * @param array $uniqueBy Fields composing the unique filter
     * @param array $updateColumns Fields to set on update/insert
     * @param int $chunkSize Chunk size for bulkWrite
     * @param array|null $hint Optional index hint (e.g., ['ucm_id' => 1, 'name' => 1])
     */
    public static function upsert(
        string $collectionName,
        array $rows,
        array $uniqueBy,
        array $updateColumns,
        int $chunkSize = 1000,
        ?array $hint = null
    ): void {
        $collection = DB::connection('mongodb')->getCollection($collectionName);

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            $ops = [];
            $now = new UTCDateTime(now());

            foreach ($chunk as $row) {
                $get = static fn(string $k) => is_array($row) ? ($row[$k] ?? null) : ($row->$k ?? null);

                // Build filter from unique keys; skip if any required key missing
                $filter = [];
                foreach ($uniqueBy as $k) {
                    $v = $get($k);
                    if ($v === null) { $filter = []; break; }
                    $filter[$k] = $v;
                }
                if (!$filter) { continue; }

                // Build $set document
                $set = ['updated_at' => $now];
                foreach ($updateColumns as $k) {
                    $set[$k] = $get($k);
                }

                $update = [
                    '$set' => $set,
                    '$setOnInsert' => ['created_at' => $now],
                ];

                $options = ['upsert' => true];
                if ($hint) { $options['hint'] = $hint; }

                $ops[] = ['updateOne' => [$filter, $update, $options]];
            }

            if ($ops) {
                $collection->bulkWrite($ops, ['ordered' => false]);
            }
        }
    }
}


