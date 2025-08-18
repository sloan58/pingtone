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
            $table->string('cluster_name')->nullable();
            $table->string('node_role')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ucms', function (Blueprint $table) {
            $table->dropColumn(['node_role', 'cluster_name']);
        });
    }
};
