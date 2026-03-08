<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // If the table doesn't exist yet, create it with all columns (including
        // the enriched ones). If it already exists (local dev), add only the
        // missing columns so existing data is preserved.
        if (! Schema::hasTable('login_logs')) {
            Schema::create('login_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('email', 255)->index();
                $table->string('ip_address', 45)->index();
                $table->text('user_agent')->nullable();
                $table->string('status', 16)->index();
                $table->string('event_type', 20)->default('login')->index();
                $table->string('location', 255)->nullable();
                $table->string('country', 100)->nullable();
                $table->string('city', 100)->nullable();
                $table->string('browser', 100)->nullable();
                $table->string('os', 100)->nullable();
                $table->string('device_type', 20)->nullable();
                $table->unsignedTinyInteger('risk_percentage')->default(0);
                $table->timestamps();
            });
            return;
        }

        Schema::table('login_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('login_logs', 'event_type')) {
                $table->string('event_type', 20)->default('login')->index()->after('status');
            }
            if (! Schema::hasColumn('login_logs', 'country')) {
                $table->string('country', 100)->nullable()->after('location');
            }
            if (! Schema::hasColumn('login_logs', 'city')) {
                $table->string('city', 100)->nullable()->after('country');
            }
            if (! Schema::hasColumn('login_logs', 'browser')) {
                $table->string('browser', 100)->nullable()->after('city');
            }
            if (! Schema::hasColumn('login_logs', 'os')) {
                $table->string('os', 100)->nullable()->after('browser');
            }
            if (! Schema::hasColumn('login_logs', 'device_type')) {
                $table->string('device_type', 20)->nullable()->after('os');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};

