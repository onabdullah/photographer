<?php

namespace App\Listeners;

use App\Models\Merchant;
use App\Services\MerchantCreditService;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Messaging\Events\PlanActivatedEvent;

class SyncMerchantCreditsOnPlanActivated
{
    /**
     * Ensure plan subscription aligns merchant base credits with plan quota.
     *
     * When a plan is activated:
     * - Sets subscription cycle dates (started_at, renewed_at, renews_at)
     * - Initializes credits: plan credits are reset each cycle, top-up credits remain indefinite
     * - Only raises balance to the plan monthly credits floor (keeps one-time top-up credits intact)
     * - Makes callback retries idempotent via startSubscriptionCycle
     */
    public function handle(PlanActivatedEvent $event): void
    {
        /** @var Merchant $merchant */
        $merchant = $event->shop;
        $plan = $event->plan ?? $merchant->plan;

        if (! $plan) {
            Log::warning('SyncMerchantCreditsOnPlanActivated: plan missing', [
                'shop' => $merchant->name ?? 'unknown',
            ]);
            return;
        }

        $before = MerchantCreditService::getSummary($merchant);
        $after = MerchantCreditService::startSubscriptionCycle($merchant, $plan);

        Log::info('SyncMerchantCreditsOnPlanActivated: subscription cycle started and credits synced', [
            'shop' => $merchant->name,
            'plan' => $plan->name,
            'from' => $before,
            'to'   => $after,
            'subscription_started_at' => $merchant->subscription_cycle_started_at?->toIso8601String(),
            'next_renewal' => $merchant->subscription_renews_at?->toIso8601String(),
        ]);
    }
}
