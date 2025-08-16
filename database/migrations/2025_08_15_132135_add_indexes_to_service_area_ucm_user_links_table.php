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
        // Create additional MongoDB indexes for optimal query performance
        $collection = DB::connection()->getCollection('service_area_ucm_user_links');
        
        // Individual indexes for reverse lookups
        $collection->createIndex(
            ['service_area_id' => 1],
            ['name' => 'links_service_area_id_idx']
        );
        
        $collection->createIndex(
            ['ucm_user_id' => 1],
            ['name' => 'links_ucm_user_id_idx']
        );
        
        // Index on created_at for performance monitoring and cleanup
        $collection->createIndex(
            ['created_at' => 1],
            ['name' => 'links_created_at_idx']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $collection = DB::connection()->getCollection('service_area_ucm_user_links');
        
        try {
            $collection->dropIndex('links_service_area_id_idx');
        } catch (\Exception $e) {
            // Index doesn't exist
        }
        
        try {
            $collection->dropIndex('links_ucm_user_id_idx');
        } catch (\Exception $e) {
            // Index doesn't exist
        }
        
        try {
            $collection->dropIndex('links_created_at_idx');
        } catch (\Exception $e) {
            // Index doesn't exist
        }
    }
};
