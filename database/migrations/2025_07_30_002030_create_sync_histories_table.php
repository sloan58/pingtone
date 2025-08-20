<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sync_histories', function (Blueprint $table) {
            $table->id();
//            $table->morphs('syncable');
            $table->timestamp('sync_start_time');
            $table->timestamp('sync_end_time')->nullable();
            $table->enum('status', ['syncing', 'completed', 'failed'])->default('syncing');
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_histories');
    }
};
