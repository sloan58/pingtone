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
     * @param array $filter Fields composing the unique filter
     * @param array $hint Index hint (e.g., ['ucm_id' => 1, 'name' => 1])
     */
    public static function upsert(
        string $collectionName,
        array $rows,
        array $filter,
        array $hint
    ): void {
        $collection = DB::connection('mongodb')->getCollection($collectionName);

        foreach (array_chunk($rows, 1000) as $chunk) {
            $ops = [];
            $now = new UTCDateTime(now());

            foreach ($chunk as $row) {
                $uniqueBy = [];
                foreach ($filter as $item) {
                    $uniqueBy[$item] = $row[$item];
                }

                $update = [
                    '$set' => $row + ['updated_at' => $now],
                    '$setOnInsert' => ['created_at' => $now],
                ];

                $options = [
                    'upsert' => true,
                    'hint' => $hint,
                ];

                $ops[] = ['updateOne' => [$uniqueBy, $update, $options]];
            }

            $collection->bulkWrite($ops, ['ordered' => false]);
        }
    }
}



