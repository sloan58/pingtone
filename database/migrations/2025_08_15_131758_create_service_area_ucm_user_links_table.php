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
        Schema::create('service_area_ucm_user_links', function (Blueprint $table) {
            $table->string('service_area_id');
            $table->string('ucm_user_id');
            $table->timestamps();
        });

        // Create MongoDB indexes for optimal query performance
        $collection = DB::connection()->getCollection('service_area_ucm_user_links');
        
        // Create compound unique index for uniqueness and bidirectional lookups
        $collection->createIndex(
            ['service_area_id' => 1, 'ucm_user_id' => 1],
            ['unique' => true, 'name' => 'service_area_ucm_user_unique_idx']
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('service_area_ucm_user_links');
    }
};
