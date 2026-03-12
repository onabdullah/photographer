<?php

namespace App\Http\Traits;

use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Objects\Values\SessionToken;

trait GetsCurrentShop
{
    /**
     * Resolve the current shop (Merchant) for Shopify app routes.
     * Tries shopify guard first, then request user, then Bearer JWT (for
     * billing routes that VerifyShopify bypasses without authenticating).
     */
    protected function currentShop(Request $request): ?Merchant
    {
        Log::debug('[GetsCurrentShop] Attempting to get current shop', [
            'shopify_guard' => auth()->guard('shopify')->check(),
            'request_user' => $request->user() ? 'exists' : 'null',
            'has_bearer' => (bool) $request->bearerToken(),
        ]);

        $shop = auth()->guard('shopify')->user() ?? $request->user();

        if ((! $shop || ! method_exists($shop, 'api')) && $request->bearerToken()) {
            $shop = $this->shopFromBearerToken($request->bearerToken());
        }

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
     * Decode the Shopify session-token JWT and look up the shop by its domain.
     * Used as a fallback for routes (like billing) that VerifyShopify skips
     * without logging in the guard.
     */
    private function shopFromBearerToken(string $token): ?Merchant
    {
        try {
            $sessionToken = new SessionToken($token);
            $domain = $sessionToken->getShopDomain()->toNative();
            if ($domain) {
                return Merchant::where('name', $domain)->first();
            }
        } catch (\Throwable $e) {
            Log::warning('[GetsCurrentShop] Bearer token decode failed', [
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }

    /**
     * Current shop's domain (name). Convenience for callers that only need the string.
     */
    protected function shopDomain(Request $request): ?string
    {
        return $this->currentShop($request)?->name ?? null;
    }
}