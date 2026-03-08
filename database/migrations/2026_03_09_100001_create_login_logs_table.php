<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('email', 255)->index();
            $table->string('ip_address', 45)->index();
            $table->text('user_agent')->nullable();
            $table->string('status', 16)->index();       // success, failed
            $table->string('event_type', 20)->default('login')->index(); // login, logout
            $table->string('location', 255)->nullable(); // combined city, region, country
            $table->string('country', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('browser', 100)->nullable();  // e.g. "Chrome 120.0"
            $table->string('os', 100)->nullable();       // e.g. "Windows 10"
            $table->string('device_type', 20)->nullable(); // Desktop, Mobile, Tablet
            $table->unsignedTinyInteger('risk_percentage')->default(0); // 0-100
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};
