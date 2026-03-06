<?php

namespace App\Http\Traits;

use App\Models\Merchant;
use Illuminate\Http\Request;

trait GetsCurrentShop
{
    /**
     * Resolve the current shop (Merchant) for Shopify app routes.
     * Tries shopify guard first, then request user.
     */
    protected function currentShop(Request $request): ?Merchant
    {
        $shop = auth()->guard('shopify')->user() ?? $request->user();

        if (! $shop || ! method_exists($shop, 'api')) {
            return null;
        }

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