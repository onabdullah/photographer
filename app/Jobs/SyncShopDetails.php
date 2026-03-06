<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Contracts\ShopModel as IShopModel;

class SyncShopDetails implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The shop (merchant) to sync.
     *
     * @var IShopModel
     */
    protected IShopModel $shop;

    /**
     * Create a new job instance.
     *
     * @param IShopModel $shop The shop model passed by the Shopify app package (AfterAuthorize).
     *
     * @return void
     */
    public function __construct(IShopModel $shop)
    {
        $this->shop = $shop;
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void
    {
        $shop = $this->shop;

        try {
            // Fetch shop details from Shopify API
            $response = $shop->api()->rest('GET', '/admin/shop.json');
            
            if ($response['errors']) {
                Log::error("SyncShopDetails: API Error fetching shop details", $response['errors']);
                return;
            }

            $shopData = $response['body']['shop'] ?? $response['body'];
            if (empty($shopData) || ! is_array($shopData)) {
                Log::warning('SyncShopDetails: Unexpected shop API response structure', ['response' => $response]);
                return;
            }

            // Update Merchant record with store name, shop owner, country (and email)
            $shop->email = $shopData['email'] ?? $shop->email;
            $shop->store_name = $shopData['name'] ?? null;
            $shop->shop_owner = $shopData['shop_owner'] ?? null;
            $shop->country = $shopData['country_name'] ?? $shopData['country'] ?? null;
            $shop->save();

            Log::info("SyncShopDetails: Updated shop details for {$shop->name}");

        } catch (\Exception $e) {
            Log::error("SyncShopDetails: Exception fetching shop details - " . $e->getMessage());
        }
    }
}
