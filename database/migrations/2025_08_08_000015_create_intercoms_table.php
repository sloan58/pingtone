<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('intercoms', function (Blueprint $table) {
            $table->string('pattern')->index();
            $table->string('uuid')->index();
            $table->string('ucm_cluster_id')->index();
            $table->unique(['uuid', 'ucm_cluster_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('intercoms');
    }
};


