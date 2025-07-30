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
        DB::connection('mongodb')->getCollection('phone_models')->createIndex([
            'name' => 1
        ]);
        DB::connection('mongodb')->getCollection('phone_models')->createIndex([
            'ucm_id' => 1
        ]);
        DB::connection('mongodb')->getCollection('phone_models')->createIndex([
            'ucm_id' => 1,
            'name' => 1
        ], ['unique' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('mongodb')->getCollection('phone_models')->dropIndex('name_1');
        DB::connection('mongodb')->getCollection('phone_models')->dropIndex('ucm_id_1');
        DB::connection('mongodb')->getCollection('phone_models')->dropIndex('ucm_id_1_name_1');
    }
}; 