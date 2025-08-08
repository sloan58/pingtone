<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ucm_user_ucm', function (Blueprint $table) {
            $table->string('ucm_user_id');
            $table->string('ucm_id');
            $table->boolean('home_cluster')->default(false);
            $table->boolean('im_presence_enabled')->default(false);
            $table->timestamps();

            $table->unique(['ucm_user_id', 'ucm_id']);
            $table->index('ucm_id');
            $table->index('ucm_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ucm_user_ucm');
    }
};


