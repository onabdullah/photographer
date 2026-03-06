<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Http\Traits\UsesShopifyTokenExchange;
use Illuminate\Http\Request;

/**
 * Product Browse API – cursor-based pagination for premium Browse from Store modal
 */
class ProductBrowseController extends Controller
{
    use GetsCurrentShop, UsesShopifyTokenExchange;

    public function index(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return response()->json(['products' => [], 'next_page_info' => null, 'prev_page_info' => null, 'has_next' => false, 'has_prev' => false]);
        }

        $limit = min((int) $request->input('limit', 24), 50);
        $pageInfo = $request->input('cursor');
        $query = $request->input('query');
        $status = $request->input('status', 'active');

        $params = ['limit' => $limit, 'fields' => 'id,title,status,image,images'];
        if ($status && $status !== 'all') {
            $params['status'] = $status;
        }
        if ($pageInfo) {
            $params['page_info'] = $pageInfo;
        }

        $response = $shop->api()->rest('GET', '/admin/products.json', $params);

        // If stored token failed, try session token exchange (axios sends Bearer token)
        if ($response['errors']) {
            $accessToken = $this->getAccessTokenForRequest($shop, $request);
            if ($accessToken) {
                $response = $this->restWithToken($shop->name, $accessToken, 'GET', '/admin/products.json', $params);
            }
        }
        $products = [];
        $nextPageInfo = null;
        $prevPageInfo = null;

        if (!$response['errors'] && isset($response['body'])) {
            $body = $response['body'];
            $shopifyProducts = is_object($body) && isset($body->products) ? $body->products : (array) ($body->products ?? []);
            if ($query && strlen(trim($query)) > 0) {
                $q = strtolower(trim($query));
                $shopifyProducts = array_values(array_filter($shopifyProducts, fn ($p) => str_contains(strtolower($p->title ?? ''), $q)));
            }
            $products = collect($shopifyProducts)->map(function ($p) {
                $p = is_array($p) ? (object) $p : $p;
                $rawImages = $p->images ?? [];
                $getSrc = fn ($img) => is_array($img) ? ($img['src'] ?? null) : ($img->src ?? null);
                $images = collect($rawImages)->map($getSrc)->filter()->values()->all();
                $mainImg = $p->image ?? null;
                $imgSrc = $mainImg ? $getSrc($mainImg) : null;
                if (!$imgSrc && !empty($images)) {
                    $imgSrc = $images[0];
                }
                if ($imgSrc && !in_array($imgSrc, $images)) {
                    $images = array_merge([$imgSrc], $images);
                }

                return [
                    'id' => (string) ($p->id ?? ''),
                    'title' => $p->title ?? '',
                    'status' => $p->status ?? 'active',
                    'image' => $imgSrc,
                    'images' => array_values(array_filter($images)),
                    'image_count' => count($rawImages),
                ];
            })->all();

            $linkHeader = $response['link'] ?? $response['headers']['Link'] ?? (isset($response['response']) ? $response['response']->getHeaderLine('Link') : null);
            if ($linkHeader) {
                $links = is_array($linkHeader) ? ($linkHeader[0] ?? '') : $linkHeader;
                if (preg_match('/<[^>]+\?([^>]+)>;\s*rel="next"/', $links, $m)) {
                    parse_str($m[1], $np);
                    $nextPageInfo = $np['page_info'] ?? null;
                }
                if (preg_match('/<[^>]+\?([^>]+)>;\s*rel="previous"/', $links, $m)) {
                    parse_str($m[1], $pp);
                    $prevPageInfo = $pp['page_info'] ?? null;
                }
            }
        }

        return response()->json([
            'products' => $products,
            'next_page_info' => $nextPageInfo,
            'prev_page_info' => $prevPageInfo,
            'has_next' => (bool) $nextPageInfo,
            'has_prev' => (bool) $prevPageInfo,
        ]);
    }

    public function show(Request $request, string $id)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $response = $shop->api()->rest('GET', "/admin/products/{$id}.json", ['fields' => 'id,title,status,images']);

        if ($response['errors']) {
            $accessToken = $this->getAccessTokenForRequest($shop, $request);
            if ($accessToken) {
                $response = $this->restWithToken($shop->name, $accessToken, 'GET', "/admin/products/{$id}.json", ['fields' => 'id,title,status,images']);
            }
        }

        if ($response['errors'] || !isset($response['body']->product)) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $p = $response['body']->product;
        $images = collect($p->images ?? [])->map(fn ($img) => $img->src ?? null)->filter()->values()->all();
        $imgSrc = $images[0] ?? null;
        if (isset($p->image) && isset($p->image->src) && !in_array($p->image->src, $images)) {
            $images = array_merge([$p->image->src], $images);
        }

        return response()->json([
            'id' => (string) $p->id,
            'title' => $p->title ?? '',
            'status' => $p->status ?? 'active',
            'image' => $imgSrc,
            'images' => array_values(array_filter($images)),
            'image_count' => count($p->images ?? []),
        ]);
    }
}
