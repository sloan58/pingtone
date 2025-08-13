<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ucm_users', function (Blueprint $table) {
            $table->string('type')->default('enduser');
        });

        // Update existing records to have type 'enduser'
        DB::table('ucm_users')->update(['type' => 'enduser']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ucm_users', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
