<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_resource_group_lists', function (Blueprint $table) {
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('ucm_cluster_id')->index();
            $table->unique(['name', 'ucm_cluster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_resource_group_lists');
    }
};
