<?php

namespace App\Http\Traits;

use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait GetsCurrentShop
{
    /**
     * Resolve the current shop (Merchant) for Shopify app routes.
     * Tries shopify guard first, then request user.
     */
    protected function currentShop(Request $request): ?Merchant
    {
        Log::debug('[GetsCurrentShop] Attempting to get current shop', [
            'shopify_guard' => auth()->guard('shopify')->check(),
            'request_user' => $request->user() ? 'exists' : 'null',
            'session' => $request->session()->all(),
        ]);

        $shop = auth()->guard('shopify')->user() ?? $request->user();

        if (! $shop || ! method_exists($shop, 'api')) {
            Log::warning('[GetsCurrentShop] No shop found or missing api method', [
                'shop' => $shop ? get_class($shop) : 'null',
            ]);
            return null;
        }

        Log::debug('[GetsCurrentShop] Shop found', [
            'shop_name' => $shop->name,
            'shop_id' => $shop->id,
        ]);

        return $shop;
    }

    /**
     * Current shop's domain (name). Convenience for callers that only need the string.
     */
    protected function shopDomain(Request $request): ?string
    {
        return $this->currentShop($request)?->name ?? null;
    }
}