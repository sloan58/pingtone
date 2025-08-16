<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ucms', function (Blueprint $table) {
            $table->string('ssh_username')->nullable();
            $table->string('ssh_password')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ucms', function (Blueprint $table) {
            $table->dropColumn(['ssh_username', 'ssh_password']);
        });
    }
};
