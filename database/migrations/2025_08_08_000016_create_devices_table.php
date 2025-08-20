<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('class')->index();
            $table->string('ucm_cluster_id')->index();
            $table->unique(['name', 'ucm_cluster_id']);
            $table->unique(['uuid', 'ucm_cluster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};


