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
        Schema::create('lines', function (Blueprint $table) {
            $table->id();
            $table->string('pkid')->unique();
            $table->string('pattern');
            $table->text('description')->nullable();
            $table->string('route_partition_name')->nullable();
            $table->string('calling_search_space_name')->nullable();
            $table->string('call_pickup_group_name')->nullable();
            $table->string('auto_answer')->default('AutoAnswerOff');
            $table->string('secondary_calling_search_space_name')->nullable();
            $table->string('recording_media_source')->nullable();
            $table->unsignedBigInteger('ucm_id');
            $table->timestamps();

            $table->foreign('ucm_id')->references('id')->on('ucms')->onDelete('cascade');
            $table->index(['pattern', 'ucm_id']);
            $table->index('route_partition_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lines');
    }
}; 