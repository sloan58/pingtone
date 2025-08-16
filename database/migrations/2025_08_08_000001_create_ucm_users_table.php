<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('ucm_users', function (Blueprint $table) {
            $table->string('userid')->index();
            $table->string('email')->index();
            $table->string('uuid')->unique();
            $table->string('ucm_id')->index();
            $table->unique(['uuid', 'ucm_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ucm_users');
    }
};



