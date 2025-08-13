<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            $table->string('name')->index();
            $table->string('uuid')->index();
            $table->string('class')->index(); // Device class (Phone, etc.)
            $table->string('ucm_id')->index();
            $table->unique(['name', 'ucm_id']);
            $table->unique(['uuid', 'ucm_id']);
        });

        // Note: MongoDB index for nested line UUIDs will be created manually or via a separate migration
        // The index should be: db.devices.createIndex({ "lines.line.dirn.uuid": 1 }, { name: "lines_line_dirn_uuid_idx" })
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};


