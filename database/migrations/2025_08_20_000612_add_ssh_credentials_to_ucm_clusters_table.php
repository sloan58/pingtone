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
        Schema::table('ucm_clusters', function (Blueprint $table) {
            $table->string('username')->nullable();
            $table->string('password')->nullable();
            $table->string('schema_version')->nullable();
            $table->string('ssh_username')->nullable();
            $table->string('ssh_password')->nullable();
            $table->string('version')->nullable();
            $table->timestamp('last_sync_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ucm_clusters', function (Blueprint $table) {
            $table->dropColumn([
                'username',
                'password', 
                'schema_version',
                'ssh_username',
                'ssh_password',
                'version',
                'last_sync_at'
            ]);
        });
    }
};
