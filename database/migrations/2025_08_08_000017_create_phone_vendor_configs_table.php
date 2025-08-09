<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_vendor_configs', function (Blueprint $table) {
            $table->string('phone_uuid')->index();
            $table->string('ucm_id')->index();
            $table->text('xml')->index();
            $table->unique(['phone_uuid', 'ucm_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_vendor_configs');
    }
};


