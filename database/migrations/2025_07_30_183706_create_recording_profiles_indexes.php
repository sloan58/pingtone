<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create indexes for recording_profiles collection
        DB::connection('mongodb')->getCollection('recording_profiles')->createIndex([
            'name' => 1
        ]);

        DB::connection('mongodb')->getCollection('recording_profiles')->createIndex([
            'uuid' => 1
        ]);

        DB::connection('mongodb')->getCollection('recording_profiles')->createIndex([
            'ucm_id' => 1
        ]);

        // Compound index for efficient upserts
        DB::connection('mongodb')->getCollection('recording_profiles')->createIndex([
            'ucm_id' => 1,
            'name' => 1
        ], ['unique' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop indexes
        DB::connection('mongodb')->getCollection('recording_profiles')->dropIndex('name_1');
        DB::connection('mongodb')->getCollection('recording_profiles')->dropIndex('uuid_1');
        DB::connection('mongodb')->getCollection('recording_profiles')->dropIndex('ucm_id_1');
        DB::connection('mongodb')->getCollection('recording_profiles')->dropIndex('ucm_id_1_name_1');
    }
};
