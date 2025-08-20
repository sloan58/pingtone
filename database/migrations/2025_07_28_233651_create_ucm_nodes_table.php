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
        Schema::create('ucm_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ucm_cluster_id')->constrained('ucm_clusters')->onDelete('cascade');
            $table->string('name');
            $table->string('hostname');
            $table->string('username');
            $table->text('password');
            $table->string('schema_version')->nullable();
            $table->string('version')->nullable();
            $table->string('cluster_name')->nullable();
            $table->string('node_role')->nullable();
            $table->string('ssh_username')->nullable();
            $table->text('ssh_password')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            
            // Remove unique constraint from name since multiple clusters can have nodes with same names
            $table->unique(['ucm_cluster_id', 'name']);
            $table->unique(['ucm_cluster_id', 'hostname']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ucm_nodes');
    }
};
