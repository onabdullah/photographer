<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Http\Traits\UsesShopifyTokenExchange;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use GetsCurrentShop, UsesShopifyTokenExchange;

    private const DEFAULT_INSTALL_CREDITS = 5;

    public function dashboard(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $credits = $shop->ai_credits_balance ?? 0;
        $shopDomain = $shop->name ?? null;

        $totalGenerated = $shopDomain
            ? ImageGeneration::where('shop_domain', $shopDomain)
                ->where('status', 'completed')
                ->whereNotNull('result_image_url')
                ->count()
            : 0;

        if ($credits <= 0 && $totalGenerated === 0) {
            $shop->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $shop->save();
            $credits = self::DEFAULT_INSTALL_CREDITS;
        }

        $totalProducts = $this->fetchProductsCount($shop, $request);

        $recentGenerations = $shopDomain
            ? ImageGeneration::where('shop_domain', $shopDomain)
                ->where('status', 'completed')
                ->whereNotNull('result_image_url')
                ->orderByDesc('updated_at')
                ->limit(7)
                ->get(['id', 'original_image_url', 'result_image_url', 'shopify_product_id', 'created_at', 'updated_at'])
            : collect();

        $base = rtrim($request->getSchemeAndHttpHost(), '/');
        $recentGenerations = $recentGenerations->map(function ($gen) use ($base) {
            $gen = $gen->toArray();
            foreach (['result_image_url', 'original_image_url'] as $key) {
                if (empty($gen[$key]) || ! is_string($gen[$key])) {
                    continue;
                }
                $url = $gen[$key];
                if (str_starts_with($url, '/')) {
                    $gen[$key] = $base . $url;
                } elseif (($path = parse_url($url, PHP_URL_PATH)) && str_starts_with($path, '/storage/')) {
                    $gen[$key] = $base . $path;
                }
            }
            return $gen;
        });

        $activePlan = $shop->plan ? $shop->plan->name : 'Free Trial';

        return \Inertia\Inertia::render('Shopify/Dashboard', [
            'shopName' => $shop->name ?? 'Shop',
            'credits' => $credits,
            'totalGenerated' => $totalGenerated,
            'totalProducts' => $totalProducts,
            'activePlan' => $activePlan,
            'recentGenerations' => $recentGenerations,
        ]);
    }

    public function productsCount(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return response()->json(['count' => 0]);
        }
        $count = $this->fetchProductsCount($shop, $request);
        return response()->json(['count' => $count]);
    }

    /**
     * Fetch products count from Shopify API.
     * Tries: (1) stored offline token, (2) session-token exchange, (3) REST fallback.
     */
    private function fetchProductsCount($shop, Request $request): int
    {
        $query = 'query { productsCount { count } }';

        if ($shop->hasOfflineAccess()) {
            $count = $this->productsCountWithToken($shop->name, $shop->password, $query);
            if ($count >= 0) {
                return $count;
            }
        }

        $sessionToken = $request->bearerToken() ?: $request->query('token');
        if ($sessionToken) {
            $accessToken = $this->exchangeSessionToken($shop->name, $sessionToken);
            if ($accessToken) {
                $count = $this->productsCountWithToken($shop->name, $accessToken, $query);
                if ($count >= 0) {
                    return $count;
                }
            }
        }

        return 0;
    }

    private function productsCountWithToken(string $shopDomain, string $accessToken, string $query): int
    {
        $version = config('shopify-app.api_version', '2024-04');
        $url = "https://{$shopDomain}/admin/api/{$version}/graphql.json";
        try {
            $client = new \GuzzleHttp\Client();
            $resp = $client->post($url, [
                'headers' => [
                    'X-Shopify-Access-Token' => $accessToken,
                    'Content-Type' => 'application/json',
                ],
                'json' => ['query' => $query],
            ]);
            $body = json_decode($resp->getBody()->getContents(), true);
            $count = $body['data']['productsCount']['count'] ?? null;
            return $count !== null ? (int) $count : -1;
        } catch (\Throwable $e) {
            return -1;
        }
    }
}
