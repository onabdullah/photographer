<?php

namespace App\Listeners;

use App\Models\Merchant;
use Osiset\ShopifyApp\Messaging\Events\AppInstalledEvent;

class GrantCreditsOnInstall
{
    /**
     * Default credits for new installs.
     */
    protected const DEFAULT_INSTALL_CREDITS = 5;

    /**
     * Handle the event.
     */
    public function handle(AppInstalledEvent $event): void
    {
        $merchantId = $event->shopId->toNative();

        $merchant = Merchant::find($merchantId);
        if (!$merchant) {
            return;
        }

        // Only grant credits on new install (when balance is 0 or null)
        $balance = $merchant->ai_credits_balance ?? 0;
        if ($balance <= 0) {
            $merchant->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $merchant->save();
        }
    }
}
