<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_pickup_groups', function (Blueprint $table) {
            $table->string('pattern')->index();
            $table->string('uuid')->index();
            $table->string('ucm_id')->index();
            $table->string('route_partition_name')->nullable()->index();
            $table->unique(['ucm_id', 'pattern', 'route_partition_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_pickup_groups');
    }
};


