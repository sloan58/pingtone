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
        Schema::create('data_dictionary_fields', function (Blueprint $table) {
            $table->string('version'); // UCM version (e.g., "15.0", "12.5")
            $table->string('table_name'); // Parent table name
            $table->string('name'); // Field name
            $table->string('field_id')->nullable(); // Field ID (e.g., "FI-25759")
            $table->string('data_type'); // Data type (e.g., "varchar(128)")
            $table->json('properties')->nullable(); // Array of properties (e.g., ["Indexed", "Unique"])
            $table->string('default_value')->nullable(); // Default value
            $table->string('migration_source')->nullable(); // Migration source
            $table->text('remarks')->nullable(); // Field remarks/description
            $table->text('description')->nullable(); // Additional description
            $table->json('rules')->nullable(); // Array of validation rules
            $table->timestamps();
            
            // Compound indexes for efficient lookups
            $table->index(['version', 'table_name']);
            $table->index(['version', 'table_name', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::drop('data_dictionary_fields');
    }
};
