<?php

namespace App\Http\Middleware;

use App\Jobs\SyncShopDetails;
use App\Models\Merchant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SyncShopDetailsWhenMissing
{
    /**
     * When the authenticated shop (Merchant) has no store_name, run the sync
     * so the database gets the exact store name and owner from Shopify.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $shop = $request->user();

        if ($shop instanceof Merchant && (empty($shop->store_name) || empty($shop->shop_owner) || empty($shop->email))) {
            try {
                SyncShopDetails::dispatchSync($shop);
                $shop->refresh();
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $next($request);
    }
}
