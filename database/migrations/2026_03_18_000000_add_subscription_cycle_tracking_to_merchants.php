<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds subscription cycle tracking to support:
     * - Monthly reset of subscription credits
     * - Indefinite validity of one-time top-up credits
     * - Proper tracking of when credits were last renewed
     */
    public function up(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            // Track when the current subscription cycle started
            $table->timestamp('subscription_cycle_started_at')
                ->nullable()
                ->after('plan_id')
                ->comment('When the current subscription cycle began');

            // Track when the subscription will renew (or did renew)
            $table->timestamp('subscription_renewed_at')
                ->nullable()
                ->after('subscription_cycle_started_at')
                ->comment('Last time subscription credits were renewed');

            // Track the next renewal date for easy queries
            $table->timestamp('subscription_renews_at')
                ->nullable()
                ->after('subscription_renewed_at')
                ->comment('When subscription credits will next renew');

            // Index for efficient daily renewal queries
            $table->index('subscription_renews_at');
        });
    }

    public function down(): void
    {
        Schema::table('merchants', function (Blueprint $table) {
            $table->dropIndex(['subscription_renews_at']);
            $table->dropColumn([
                'subscription_cycle_started_at',
                'subscription_renewed_at',
                'subscription_renews_at',
            ]);
        });
    }
};
