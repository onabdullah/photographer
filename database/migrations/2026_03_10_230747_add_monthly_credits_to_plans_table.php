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
        if (Schema::hasColumn('plans', 'monthly_credits')) {
            return;
        }
        Schema::table('plans', function (Blueprint $table) {
            $table->unsignedInteger('monthly_credits')->default(0)->after('on_install');
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('monthly_credits');
        });
    }
};
