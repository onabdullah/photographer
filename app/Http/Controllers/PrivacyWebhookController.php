<?php

namespace App\Http\Controllers;

use App\Models\EmailLog;
use App\Models\Image;
use App\Models\ImageGeneration;
use App\Models\MailLog;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Handles Shopify mandatory GDPR / privacy webhooks.
 *
 * All three endpoints are required by Shopify App Store rules and are
 * registered in the Partner Dashboard under App → Privacy → GDPR webhooks.
 * Every request is HMAC-verified by the VerifyShopifyWebhookHmac middleware
 * before reaching these methods.
 *
 * @see https://shopify.dev/docs/apps/build/privacy-law-compliance
 */
class PrivacyWebhookController extends Controller
{
    /**
     * customers/data_request
     *
     * A customer (or the merchant on their behalf) has requested a copy of
     * all data this app holds about them. This app stores no per-customer PII —
     * only merchant-level (shop) data — so we acknowledge and log.
     *
     * Shopify requires a 200 response within 5 seconds.
     */
    public function customerDataRequest(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->json()->all();
        Log::channel('privacy')->info('customers/data_request received', [
            'shop_domain' => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
        ]);

        return response()->json(['acknowledged' => true]);
    }

    /**
     * customers/redact
     *
     * Shopify asks the app to erase all data it holds about a specific customer.
     * This app stores no per-customer PII, so we acknowledge and log.
     */
    public function customerRedact(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->json()->all();
        Log::channel('privacy')->info('customers/redact received', [
            'shop_domain' => $payload['shop_domain'] ?? null,
            'customer_id' => $payload['customer']['id'] ?? null,
        ]);

        return response()->json(['acknowledged' => true]);
    }

    /**
     * shop/redact
     *
     * Triggered 48 hours or more after a merchant uninstalls the app.
     * All shop data must be erased. This formally handles what
     * ShopifyUninstallListener begins at uninstall time.
     */
    public function shopRedact(Request $request): \Illuminate\Http\JsonResponse
    {
        $payload = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? null;

        Log::channel('privacy')->info('shop/redact received', [
            'shop_domain' => $shopDomain,
            'shop_id' => $payload['shop_id'] ?? null,
        ]);

        if (! $shopDomain) {
            Log::channel('privacy')->warning('shop/redact: missing shop_domain in payload');
            return response()->json(['acknowledged' => true]);
        }

        try {
            $merchant = Merchant::where('name', $shopDomain)->first();

            if ($merchant) {
                // Delete all associated records in dependent order.
                // Image, ImageGeneration, EmailLog, MailLog have no SoftDeletes — use delete().
                // Merchant uses SoftDeletes — forceDelete() ensures the row is permanently removed (GDPR requires hard deletion).
                ImageGeneration::where('shop_domain', $shopDomain)->delete();
                Image::where('merchant_id', $merchant->id)->delete();
                EmailLog::where('merchant_id', $merchant->id)->delete();
                MailLog::where('merchant_id', $merchant->id)->delete();

                $merchant->forceDelete();

                Log::channel('privacy')->info('shop/redact: merchant data erased', [
                    'shop_domain' => $shopDomain,
                    'merchant_id' => $merchant->id,
                ]);
            } else {
                Log::channel('privacy')->info('shop/redact: no merchant record found (already cleaned up)', [
                    'shop_domain' => $shopDomain,
                ]);
            }
        } catch (\Throwable $e) {
            // Log but still return 200 — Shopify will retry on non-2xx responses,
            // which could cause duplicate deletion attempts.
            Log::channel('privacy')->error('shop/redact: error during deletion', [
                'shop_domain' => $shopDomain,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json(['acknowledged' => true]);
    }
}
