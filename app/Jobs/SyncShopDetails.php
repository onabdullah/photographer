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
                Log::channel('sync_shop')->error('API error fetching shop details', [
                    'shop' => $shop->name,
                    'status' => $response['status'] ?? null,
                    'errors' => $response['body'] ?? $response['errors'],
                ]);
                return;
            }

            $body = $this->toArray($response['body'] ?? []);
            $shopData = $this->toArray($body['shop'] ?? $body);
            if (empty($shopData) || ! is_array($shopData)) {
                Log::channel('sync_shop')->warning('Unexpected shop API response structure', [
                    'shop' => $shop->name,
                    'status' => $response['status'] ?? null,
                    'body_type' => gettype($body),
                    'body_keys' => is_array($body) ? array_keys($body) : null,
                ]);
                return;
            }

            // Update Merchant record with exact store name and owner from Shopify
            $shop->email = $shopData['email'] ?? $shop->email;
            $shop->store_name = isset($shopData['name']) ? (string) $shopData['name'] : $shop->store_name;
            $shop->shop_owner = isset($shopData['shop_owner']) ? (string) $shopData['shop_owner'] : $shop->shop_owner;
            $shop->country = $shopData['country_name'] ?? $shopData['country'] ?? $shop->country;
            $shop->save();

            Log::channel('sync_shop')->info('Shop details synced', ['shop' => $shop->name, 'store_name' => $shop->store_name, 'shop_owner' => $shop->shop_owner, 'email' => $shop->email]);

        } catch (\Exception $e) {
            Log::channel('sync_shop')->error('Exception fetching shop details', ['shop' => $shop->name, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Normalize Shopify SDK response values (array/ResponseAccess/object) into arrays.
     */
    private function toArray(mixed $value): array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_object($value) && method_exists($value, 'toArray')) {
            $converted = $value->toArray();
            return is_array($converted) ? $converted : [];
        }

        if (is_object($value)) {
            return (array) $value;
        }

        return [];
    }
}
