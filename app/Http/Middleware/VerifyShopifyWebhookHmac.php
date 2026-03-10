<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Verify that an incoming webhook request genuinely came from Shopify.
 *
 * Shopify signs every webhook with HMAC-SHA256 using the app's API secret
 * and includes the signature in the X-Shopify-Hmac-Sha256 header (base64-encoded).
 *
 * @see https://shopify.dev/docs/apps/build/webhooks/validate
 */
class VerifyShopifyWebhookHmac
{
    public function handle(Request $request, Closure $next): Response
    {
        $secret = config('shopify-app.api_secret');
        $header = $request->header('X-Shopify-Hmac-Sha256');

        if (empty($secret) || empty($header)) {
            abort(401, 'Missing HMAC signature.');
        }

        // Use the raw request body — must not be parsed/modified before this middleware runs.
        $rawBody = $request->getContent();
        $computed = base64_encode(hash_hmac('sha256', $rawBody, $secret, true));

        if (! hash_equals($computed, $header)) {
            abort(401, 'HMAC verification failed.');
        }

        return $next($request);
    }
}
