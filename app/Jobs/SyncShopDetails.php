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
            // Fetch shop details from Shopify API (GET /admin/shop.json returns { "shop": { "name", "shop_owner", ... } })
            $response = $shop->api()->rest('GET', '/admin/shop.json');

            if (! empty($response['errors'])) {
                Log::error('SyncShopDetails: API Error fetching shop details', ['errors' => $response['errors']]);
                return;
            }

            $body = $response['body'] ?? [];
            $shopData = $body['shop'] ?? $body;
            if (empty($shopData) || ! is_array($shopData)) {
                Log::warning('SyncShopDetails: Unexpected shop API response structure', ['body_keys' => is_array($body) ? array_keys($body) : gettype($body)]);
                return;
            }

            // Update Merchant record with exact store name and owner from Shopify
            $shop->email = $shopData['email'] ?? $shop->email;
            $shop->store_name = isset($shopData['name']) ? (string) $shopData['name'] : $shop->store_name;
            $shop->shop_owner = isset($shopData['shop_owner']) ? (string) $shopData['shop_owner'] : $shop->shop_owner;
            $shop->country = $shopData['country_name'] ?? $shopData['country'] ?? $shop->country;
            $shop->save();

            Log::info("SyncShopDetails: Updated shop details for {$shop->name}", ['store_name' => $shop->store_name, 'shop_owner' => $shop->shop_owner]);

        } catch (\Exception $e) {
            Log::error("SyncShopDetails: Exception fetching shop details - " . $e->getMessage());
        }
    }
}
