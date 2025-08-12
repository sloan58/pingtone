<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $collection = DB::connection()->getCollection('phone_apis');
        
        // Create indexes using MongoDB classes
        $collection->createIndex(['phone_name' => 1]);
        $collection->createIndex(['ucm_id' => 1]);
        $collection->createIndex(['timestamp' => 1], ['expireAfterSeconds' => 2592000]); // 30 days TTL
        $collection->createIndex(['api_type' => 1]);
        $collection->createIndex(['ip_address' => 1]);
        $collection->createIndex(['success' => 1]);
        
        // Compound indexes for efficient querying
        $collection->createIndex(['ucm_id' => 1, 'timestamp' => 1]);
        $collection->createIndex(['phone_name' => 1, 'ucm_id' => 1, 'timestamp' => 1]);
        $collection->createIndex(['phone_name' => 1, 'api_type' => 1, 'ucm_id' => 1]);
        $collection->createIndex(['ucm_id' => 1, 'api_type' => 1, 'timestamp' => 1]);
        $collection->createIndex(['ucm_id' => 1, 'success' => 1]);
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_apis');
    }
};
