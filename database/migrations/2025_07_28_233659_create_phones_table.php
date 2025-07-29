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
        Schema::create('phones', function (Blueprint $table) {
            $table->id();
            $table->string('pkid')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('model');
            $table->string('protocol')->default('SIP');
            $table->string('location_name')->nullable();
            $table->string('calling_search_space_name')->nullable();
            $table->string('subscribe_calling_search_space_name')->nullable();
            $table->string('device_pool_name')->nullable();
            $table->string('sip_profile_name')->nullable();
            $table->string('phone_template_name')->nullable();
            $table->string('softkey_template_name')->nullable();
            $table->string('common_phone_config_name')->nullable();
            $table->json('expansion_modules')->nullable();
            $table->string('hlog')->nullable();
            $table->string('dnd_status')->nullable();
            $table->string('owner_user_name')->nullable();
            $table->string('load_information')->nullable();
            $table->json('vendor_config')->nullable();
            $table->boolean('enable_extension_mobility')->default(false);
            $table->string('authentication_url')->nullable();
            $table->string('secure_authentication_url')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('status')->default('Registered');
            $table->string('registered_with')->nullable();
            $table->string('active_load')->nullable();
            $table->string('inactive_load')->nullable();
            $table->text('css_full_text')->nullable();
            $table->unsignedBigInteger('ucm_id');
            $table->timestamps();

            $table->foreign('ucm_id')->references('id')->on('ucms')->onDelete('cascade');
            $table->index(['name', 'ucm_id']);
            $table->index('model');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phones');
    }
}; 