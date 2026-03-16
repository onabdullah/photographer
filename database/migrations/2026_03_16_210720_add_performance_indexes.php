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
        // Composite indexes for frequently queried columns
        Schema::table('image_generations', function (Blueprint $table) {
            $table->index(['shop_domain', 'status', 'created_at'], 'idx_img_gen_shop_status_date');
        });

        Schema::table('mail_logs', function (Blueprint $table) {
            $table->index(['status', 'created_at'], 'idx_mail_status_date');
        });

        Schema::table('login_logs', function (Blueprint $table) {
            $table->index(['created_at', 'status', 'event_type'], 'idx_login_date_status_type');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->index(['created_at'], 'idx_merchants_created');
        });

        // Add indexes for foreign key lookups
        Schema::table('mail_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('mail_logs', 'updated_at')) {
                $table->index('smtp_setting_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('image_generations', function (Blueprint $table) {
            $table->dropIndex('idx_img_gen_shop_status_date');
        });

        Schema::table('mail_logs', function (Blueprint $table) {
            $table->dropIndex('idx_mail_status_date');
        });

        Schema::table('login_logs', function (Blueprint $table) {
            $table->dropIndex('idx_login_date_status_type');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->dropIndex('idx_merchants_created');
        });
    }
};
