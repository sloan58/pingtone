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
     * @param array|null $hint Optional index hint (e.g., ['ucm_id' => 1, 'name' => 1])
     */
    public static function upsert(
        string $collectionName,
        array $rows,
        array $uniqueBy,
        array $hint
    ): void {
        $collection = DB::connection('mongodb')->getCollection($collectionName);

        foreach (array_chunk($rows, 1000) as $chunk) {
            $ops = [];
            $now = new UTCDateTime(now());

            foreach ($chunk as $row) {
                // Normalize row to associative array (preserve nested structures)
                $rowArray = json_decode(json_encode($row), true);

                $get = static fn(string $k) => $rowArray[$k] ?? null;

                // Build filter directly from required unique keys (assume presence)
                $filter = array_intersect_key($rowArray, array_flip($uniqueBy));

                $update = [
                    '$set' => [...$rowArray, 'updated_at' => $now],
                    '$setOnInsert' => ['created_at' => $now],
                ];

                $options = [
                    'upsert' => true,
                    'hint' => $hint,
                ];

                $ops[] = ['updateOne' => [$filter, $update, $options]];
            }

            $collection->bulkWrite($ops, ['ordered' => false]);
        }
    }
}



