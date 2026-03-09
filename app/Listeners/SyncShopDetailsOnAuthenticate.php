<?php

namespace App\Listeners;

use App\Jobs\SyncShopDetails;
use App\Models\Merchant;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Messaging\Events\ShopAuthenticatedEvent;

class SyncShopDetailsOnAuthenticate
{
    /**
     * Sync store data immediately after authentication when key fields are missing.
     */
    public function handle(ShopAuthenticatedEvent $event): void
    {
        $merchantId = $event->shopId->toNative();

        $merchant = Merchant::find($merchantId);
        if (! $merchant) {
            Log::channel('sync_shop')->warning('Merchant not found during auth sync', [
                'merchant_id' => $merchantId,
            ]);
            return;
        }

        if (! empty($merchant->store_name) && ! empty($merchant->shop_owner) && ! empty($merchant->email)) {
            return;
        }

        try {
            SyncShopDetails::dispatchSync($merchant);
        } catch (\Throwable $e) {
            Log::channel('sync_shop')->error('Immediate auth sync failed', [
                'shop' => $merchant->name,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
