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
        Schema::create('ucms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('hostname')->unique();
            $table->string('username');
            $table->text('password');
            $table->string('schema_version')->nullable();
            $table->string('version')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ucms');
    }
}; 