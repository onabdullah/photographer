<?php

namespace App\Listeners;

use Osiset\ShopifyApp\Messaging\Events\AppUninstalledEvent as OsisetShopifyAppMessagingEventsAppUninstalledEvent;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class ShopifyUninstallListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }


    /**
     * Handle the event.
     */
    public function handle(OsisetShopifyAppMessagingEventsAppUninstalledEvent $event): void
    {
        $shop = \App\Models\Merchant::where('name', $event->shopDomain->toNative())->first();


        // 1. Anonymize images immediately
        // "Crucial GDPR Rule: If a merchant uninstalls, you must set their shop_id on these images to null."
        if ($shop) {
             \App\Models\Image::where('merchant_id', $shop->id)
                ->update(['merchant_id' => null]);

            // 2. Schedule email log scrubbing for 48 hours later
            // "sent_to_email must be scrubbed to null 48 hours after they uninstall your app"
            \App\Jobs\ScrubMerchantEmailLogs::dispatch($shop->id)
                ->delay(now()->addHours(48));
        }
    }
}
