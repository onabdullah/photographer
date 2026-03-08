<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
        Schema::table('login_logs', function (Blueprint $table) {
            $table->dropColumn(['event_type', 'country', 'city', 'browser', 'os', 'device_type']);
        });
    }
};
