<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ucm_user_ucm', function (Blueprint $table) {
            $table->string('ucm_user_id')->index();
            $table->string('ucm_id')->index();
            $table->timestamps();

            $table->unique(['ucm_user_id', 'ucm_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ucm_user_ucm');
    }
};



