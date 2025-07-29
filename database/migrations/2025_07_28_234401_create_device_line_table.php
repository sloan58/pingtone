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
        Schema::create('device_line', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('phone_id');
            $table->unsignedBigInteger('line_id');
            $table->string('index')->default('1');
            $table->string('dirn')->nullable();
            $table->string('display')->nullable();
            $table->string('display_ascii')->nullable();
            $table->string('e164_alt_num')->nullable();
            $table->string('external_phone_number_mask')->nullable();
            $table->string('max_num_calls')->default('1');
            $table->string('busy_trigger')->default('1');
            $table->string('ring_settings')->nullable();
            $table->timestamps();

            $table->foreign('phone_id')->references('id')->on('phones')->onDelete('cascade');
            $table->foreign('line_id')->references('id')->on('lines')->onDelete('cascade');
            $table->unique(['phone_id', 'line_id', 'index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('device_line');
    }
}; 