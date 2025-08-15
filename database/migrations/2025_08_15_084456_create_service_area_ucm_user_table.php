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
        Schema::create('service_area_ucm_user', function (Blueprint $table) {
            $table->id();
            $table->string('service_area_id')->index();
            $table->string('ucm_user_id')->index();
            $table->timestamps();
            
            $table->unique(['service_area_id', 'ucm_user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_area_ucm_user');
    }
};
