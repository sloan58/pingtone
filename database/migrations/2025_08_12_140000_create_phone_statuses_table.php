<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection()->getCollection('phone_statuses');

        // Create indexes using MongoDB classes
        $collection->createIndex(['phone_name' => 1]);
        $collection->createIndex(['ucm_cluster_id' => 1]);
        $collection->createIndex(['timestamp' => 1], ['expireAfterSeconds' => 2592000]); // 30 days TTL
        $collection->createIndex(['cm_node' => 1]);

        // Compound indexes for efficient querying
        $collection->createIndex(['ucm_cluster_id' => 1, 'timestamp' => 1]);
        $collection->createIndex(['phone_name' => 1, 'ucm_cluster_id' => 1, 'timestamp' => 1]);
        $collection->createIndex(['ucm_cluster_id' => 1, 'cm_node' => 1]);
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_statuses');
    }
};
