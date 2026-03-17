<?php

namespace App\Services;

use App\Models\Merchant;
use App\Models\Plan;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class MerchantCreditService
{
    private const SETTINGS_KEY = 'credit_wallet';

    public static function getSummary(Merchant $merchant): array
    {
        $wallet = self::wallet($merchant);

        return [
            'plan_cycle_credits' => (int) ($wallet['plan_cycle_credits'] ?? 0),
            'plan_cycle_remaining' => (int) ($wallet['plan_cycle_remaining'] ?? 0),
            'top_up_credits' => (int) ($wallet['top_up_credits'] ?? 0),
            'total_credits' => (int) ($wallet['total_credits'] ?? 0),
        ];
    }

    public static function activatePlan(Merchant $merchant, ?Plan $plan): array
    {
        if (! $plan) {
            return self::getSummary($merchant);
        }

        $wallet = self::wallet($merchant);
        $planCredits = (int) ($plan->monthly_credits ?? 0);
        if ($planCredits <= 0) {
            return self::persist($merchant, $wallet);
        }

        $wallet['plan_cycle_credits'] = $planCredits;
        $wallet['plan_cycle_remaining'] = max((int) ($wallet['plan_cycle_remaining'] ?? 0), $planCredits);

        return self::persist($merchant, $wallet);
    }

    public static function addTopUpCredits(Merchant $merchant, int $credits): array
    {
        $wallet = self::wallet($merchant);
        $wallet['top_up_credits'] = max(0, (int) ($wallet['top_up_credits'] ?? 0) + max(0, $credits));

        return self::persist($merchant, $wallet);
    }

    public static function deductCredits(Merchant $merchant, int $credits): array
    {
        $wallet = self::wallet($merchant);
        $remaining = max(0, $credits);

        $planRemaining = (int) ($wallet['plan_cycle_remaining'] ?? 0);
        $usedFromPlan = min($planRemaining, $remaining);
        $planRemaining -= $usedFromPlan;
        $remaining -= $usedFromPlan;

        $topUpCredits = (int) ($wallet['top_up_credits'] ?? 0);
        $usedFromTopUp = min($topUpCredits, $remaining);
        $topUpCredits -= $usedFromTopUp;

        $wallet['plan_cycle_remaining'] = $planRemaining;
        $wallet['top_up_credits'] = $topUpCredits;

        return self::persist($merchant, $wallet);
    }

    /**
     * Start a new subscription cycle.
     *
     * Called when a merchant first subscribes to a plan.
     * Records when the cycle started and when it will renew (in 30 days).
     *
     * @return array The updated wallet summary
     */
    public static function startSubscriptionCycle(Merchant $merchant, Plan $plan): array
    {
        $now = now();
        $renewsAt = $now->clone()->addMonth();

        $merchant->forceFill([
            'subscription_cycle_started_at' => $now,
            'subscription_renewed_at' => $now,
            'subscription_renews_at' => $renewsAt,
        ])->save();

        // Initialize or update the wallet with plan credits
        return self::activatePlan($merchant, $plan);
    }

    /**
     * Renew subscription credits for a merchant.
     *
     * Called when a subscription cycle ends. This:
     * - Resets plan_cycle_remaining to plan_cycle_credits (monthly refresh)
     * - Preserves top_up_credits indefinitely (one-time purchases)
     * - Records the renewal timestamp
     *
     * @return array The updated wallet summary
     */
    public static function renewSubscriptionCycle(Merchant $merchant): array
    {
        $plan = $merchant->plan;
        if (! $plan) {
            return self::getSummary($merchant);
        }

        $wallet = self::wallet($merchant);
        $planCredits = (int) ($plan->monthly_credits ?? 0);

        // Reset plan cycle credits to full amount, keep top-up credits
        $wallet['plan_cycle_credits'] = $planCredits;
        $wallet['plan_cycle_remaining'] = $planCredits;
        // top_up_credits is NOT reset - they're indefinite

        $now = now();
        $merchant->forceFill([
            'subscription_renewed_at' => $now,
            'subscription_renews_at' => $now->clone()->addMonth(),
        ])->save();

        return self::persist($merchant, $wallet);
    }

    /**
     * Check if a merchant's subscription cycle has ended and needs renewal.
     *
     * Returns true if the subscription_renews_at date has passed.
     *
     * @return bool True if renewal is needed
     */
    public static function needsSubscriptionRenewal(Merchant $merchant): bool
    {
        if (! $merchant->plan_id || ! $merchant->subscription_renews_at) {
            return false;
        }

        return now()->isAfter($merchant->subscription_renews_at);
    }

    /**
     * Automatically check and renew subscription cycle if needed.
     *
     * Safe to call multiple times - idempotent because subscription_renews_at
     * is updated each time so subsequent calls in the same hour won't re-renew.
     *
     * @return bool True if renewal was performed
     */
    public static function checkAndRenewSubscription(Merchant $merchant): bool
    {
        if (! self::needsSubscriptionRenewal($merchant)) {
            return false;
        }

        self::renewSubscriptionCycle($merchant);
        return true;
    }

    private static function wallet(Merchant $merchant): array
    {
        $settings = is_array($merchant->app_settings) ? $merchant->app_settings : [];
        $wallet = $settings[self::SETTINGS_KEY] ?? null;

        if (is_array($wallet)) {
            $planCycleCredits = max(0, (int) ($wallet['plan_cycle_credits'] ?? 0));
            $planCycleRemaining = max(0, (int) ($wallet['plan_cycle_remaining'] ?? 0));
            $topUpCredits = max(0, (int) ($wallet['top_up_credits'] ?? 0));

            return [
                'plan_cycle_credits' => $planCycleCredits,
                'plan_cycle_remaining' => min($planCycleRemaining, max($planCycleCredits, $planCycleRemaining)),
                'top_up_credits' => $topUpCredits,
                'total_credits' => $planCycleRemaining + $topUpCredits,
            ];
        }

        return self::migrateLegacyBalance($merchant);
    }

    private static function migrateLegacyBalance(Merchant $merchant): array
    {
        $currentBalance = max(0, (int) ($merchant->ai_credits_balance ?? 0));
        $planCredits = max(0, (int) ($merchant->plan?->monthly_credits ?? 0));

        if ($planCredits > 0) {
            $planCycleRemaining = min($currentBalance, $planCredits);
            $topUpCredits = max(0, $currentBalance - $planCycleRemaining);
        } else {
            $planCycleRemaining = $currentBalance;
            $topUpCredits = 0;
            $planCredits = $planCycleRemaining;
        }

        return [
            'plan_cycle_credits' => $planCredits,
            'plan_cycle_remaining' => $planCycleRemaining,
            'top_up_credits' => $topUpCredits,
            'total_credits' => $planCycleRemaining + $topUpCredits,
        ];
    }

    private static function persist(Merchant $merchant, array $wallet): array
    {
        $planCycleCredits = max(0, (int) ($wallet['plan_cycle_credits'] ?? 0));
        $planCycleRemaining = max(0, (int) ($wallet['plan_cycle_remaining'] ?? 0));
        $topUpCredits = max(0, (int) ($wallet['top_up_credits'] ?? 0));
        $totalCredits = $planCycleRemaining + $topUpCredits;

        $settings = is_array($merchant->app_settings) ? $merchant->app_settings : [];
        $settings[self::SETTINGS_KEY] = [
            'plan_cycle_credits' => $planCycleCredits,
            'plan_cycle_remaining' => $planCycleRemaining,
            'top_up_credits' => $topUpCredits,
            'updated_at' => now()->toIso8601String(),
        ];

        $merchant->forceFill([
            'app_settings' => $settings,
            'ai_credits_balance' => $totalCredits,
        ])->save();

        return [
            'plan_cycle_credits' => $planCycleCredits,
            'plan_cycle_remaining' => $planCycleRemaining,
            'top_up_credits' => $topUpCredits,
            'total_credits' => $totalCredits,
        ];
    }
}
