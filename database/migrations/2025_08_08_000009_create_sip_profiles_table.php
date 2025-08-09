<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sip_profiles', function (Blueprint $table) {
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('ucm_id')->index();
            $table->unique(['name', 'ucm_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sip_profiles');
    }
};


