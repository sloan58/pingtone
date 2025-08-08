<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ucm_users', function (Blueprint $table) {
            $table->string('userid')->unique();
            $table->string('email')->unique();
            $table->string('uuid')->unique();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ucm_users');
    }
};


