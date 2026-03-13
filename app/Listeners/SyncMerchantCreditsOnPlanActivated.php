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
     * We only raise balance to the plan monthly credits floor. This keeps
     * one-time top-up credits intact and makes callback retries idempotent.
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
        $after = MerchantCreditService::activatePlan($merchant, $plan);

        Log::info('SyncMerchantCreditsOnPlanActivated: credits synced', [
            'shop' => $merchant->name,
            'plan' => $plan->name,
            'from' => $before,
            'to'   => $after,
        ]);
    }
}
