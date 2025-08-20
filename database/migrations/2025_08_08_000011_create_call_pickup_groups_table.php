<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_pickup_groups', function (Blueprint $table) {
            $table->string('pattern')->index();
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('ucm_cluster_id')->index();
            $table->unique(['name', 'ucm_cluster_id']); // Must be in the right order for 'hint' to work
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_pickup_groups');
    }
};


