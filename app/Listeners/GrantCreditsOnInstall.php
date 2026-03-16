<?php

namespace App\Listeners;

use App\Jobs\SendInstallEmailsJob;
use App\Models\Merchant;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Messaging\Events\AppInstalledEvent;

class GrantCreditsOnInstall
{
    protected const DEFAULT_INSTALL_CREDITS = 5;

    public function handle(AppInstalledEvent $event): void
    {
        $merchantId = $event->shopId->toNative();

        Log::channel('install')->info('Fired', ['merchant_id' => $merchantId]);

        $merchant = Merchant::find($merchantId);
        if (! $merchant) {
            Log::channel('install')->warning('Merchant not found', ['merchant_id' => $merchantId]);
            return;
        }

        // Determine if this is a reinstall (existing balance > 0)
        $balance        = $merchant->ai_credits_balance ?? 0;
        $isReinstall    = $balance > 0;
        $creditsGranted = 0;

        if (! $isReinstall) {
            $merchant->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $merchant->save();
            $creditsGranted = self::DEFAULT_INSTALL_CREDITS;
            Log::channel('install')->info('Credits granted', ['shop' => $merchant->name, 'credits' => $creditsGranted]);
        } else {
            Log::channel('install')->info('Reinstall — no credits granted', ['shop' => $merchant->name, 'balance' => $balance]);
        }

        // Dispatch email sending as a background job — never block the OAuth callback with SMTP.
        SendInstallEmailsJob::dispatch($merchantId, $creditsGranted, $isReinstall);

        Log::channel('install')->info('Email job dispatched', ['shop' => $merchant->name]);
    }
}
