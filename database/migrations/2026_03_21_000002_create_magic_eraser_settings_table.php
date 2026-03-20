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
        Schema::create('magic_eraser_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique()->index();
            $table->longText('value')->nullable();
            $table->string('created_by')->nullable()->comment('Admin email');
            $table->string('updated_by')->nullable()->comment('Admin email');
            $table->timestamps();
            $table->index('created_at');
        });

        // Track audit log for magic eraser settings changes
        Schema::create('magic_eraser_settings_audit', function (Blueprint $table) {
            $table->id();
            $table->string('admin_email')->nullable();
            $table->string('setting_key');
            $table->longText('old_value')->nullable();
            $table->longText('new_value')->nullable();
            $table->string('action')->default('update'); // create, update, delete
            $table->timestamps();
            $table->index('admin_email');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('magic_eraser_settings_audit');
        Schema::dropIfExists('magic_eraser_settings');
    }
};
