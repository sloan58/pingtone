<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_area_device_links', function (Blueprint $table) {
            $table->string('service_area_id');
            $table->string('device_id');
            $table->string('device_type')->nullable(); // 'Phone', 'DeviceProfile', 'RemoteDestinationProfile', etc.
            $table->timestamps();
        });

        // Create MongoDB indexes for optimal query performance
        $collection = DB::connection()->getCollection('service_area_device_links');
        
        // Create compound unique index for uniqueness and bidirectional lookups
        $collection->createIndex(
            ['service_area_id' => 1, 'device_id' => 1],
            ['unique' => true, 'name' => 'service_area_device_unique_idx']
        );
        
        // Individual indexes for reverse lookups
        $collection->createIndex(
            ['service_area_id' => 1],
            ['name' => 'device_links_service_area_id_idx']
        );
        
        $collection->createIndex(
            ['device_id' => 1],
            ['name' => 'device_links_device_id_idx']
        );
        
        // Index on device_type for filtering by type
        $collection->createIndex(
            ['device_type' => 1],
            ['name' => 'device_links_device_type_idx']
        );
        
        // Index on created_at for performance monitoring and cleanup
        $collection->createIndex(
            ['created_at' => 1],
            ['name' => 'device_links_created_at_idx']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('service_area_device_links');
    }
};
