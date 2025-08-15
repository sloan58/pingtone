<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('service_areas')) {
            Schema::create('service_areas', function (Blueprint $table) {
                $table->string('name');
                $table->timestamps();
                $table->unique(['name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('service_areas');
    }
};
