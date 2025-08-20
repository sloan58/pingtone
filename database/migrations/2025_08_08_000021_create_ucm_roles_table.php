<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ucm_roles', function (Blueprint $table) {
            $table->string('uuid')->index();
            $table->string('name')->index();
            $table->string('ucm_cluster_id')->index();
            $table->unique(['ucm_cluster_id', 'uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ucm_roles');
    }
};


