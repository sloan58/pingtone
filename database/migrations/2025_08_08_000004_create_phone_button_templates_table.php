<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_button_templates', function (Blueprint $table) {
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('ucm_cluster_id')->index();
            $table->string('model')->nullable()->index();
            $table->string('protocol')->nullable()->index();
            $table->unique(['name', 'ucm_cluster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_button_templates');
    }
};


