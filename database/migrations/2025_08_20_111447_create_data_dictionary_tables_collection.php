<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('data_dictionary_tables', function (Blueprint $table) {
            $table->string('version'); // UCM version (e.g., "15.0", "12.5")
            $table->string('name'); // Table name
            $table->string('table_id')->nullable(); // Table ID (e.g., "TI-1087")
            $table->text('description')->nullable(); // Table description
            $table->json('uniqueness_constraints')->nullable(); // Array of uniqueness constraints
            $table->bigInteger('row_count')->nullable(); // Estimated row count
            $table->float('size_mb')->nullable(); // Estimated size in MB
            $table->timestamps();
            
            // Compound index for version + name lookups
            $table->index(['version', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('data_dictionary_tables');
    }
};
