<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Osiset\ShopifyApp\Exceptions\MissingAuthUrlException;
use Symfony\Component\HttpFoundation\Response;
use Osiset\ShopifyApp\Objects\Enums\AuthMode;
use Osiset\ShopifyApp\Util;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
        $middleware->validateCsrfTokens(except: [
            'shopify/generate-image',
            'shopify/remove-background',
            'shopify/tools/upscale',
            'shopify/tools/enhance',
            'shopify/tools/magic-eraser',
            'shopify/tools/lighting',
            'shopify/save-to-shopify',
            'shopify/assign-to-product',
            'shopify/settings', // Embedded app iframe often blocks cookies; route is protected by verify.shopify
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (MissingAuthUrlException $e, Request $request) {
            try {
                $shopDomainValue = $request->get('shop') ?: $request->user()?->getDomain();
                $shopDomainNative = is_object($shopDomainValue) && method_exists($shopDomainValue, 'toNative')
                    ? $shopDomainValue->toNative()
                    : (string) $shopDomainValue;
                if (! $shopDomainNative) {
                    return null;
                }

                $shop = \App\Models\Merchant::where('name', $shopDomainNative)->first();
                if (! $shop) {
                    return null;
                }

                $apiHelper = $shop->apiHelper();
                $grantMode = $shop->hasOfflineAccess()
                    ? AuthMode::fromNative(Util::getShopifyConfig('api_grant_mode', $shop))
                    : AuthMode::OFFLINE();
                $scopes = Util::getShopifyConfig('api_scopes', $shop);
                $url = $apiHelper->buildAuthUrl($grantMode, $scopes);
                if ($url === '') {
                    return null;
                }

                $viewData = [
                    'apiKey' => Util::getShopifyConfig('api_key', $shopDomainNative),
                    'url' => $url,
                    'host' => $request->get('host'),
                    'shopDomain' => $shopDomainNative,
                    'locale' => $request->get('locale'),
                ];

                return new Response(
                    View::make('shopify-app::auth.fullpage_redirect', $viewData)->render(),
                    Response::HTTP_OK,
                    ['Content-Type' => 'text/html']
                );
            } catch (\Throwable) {
                return null;
            }
        });
    })->create();
