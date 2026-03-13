<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\Plan;
use Gnikyt\BasicShopifyAPI\Session;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Osiset\ShopifyApp\Actions\ActivatePlan;
use Osiset\ShopifyApp\Contracts\ApiHelper as IApiHelper;
use Osiset\ShopifyApp\Objects\Values\ChargeReference;
use Osiset\ShopifyApp\Objects\Values\PlanId;
use Osiset\ShopifyApp\Objects\Values\ShopId;

class BillingController extends Controller
{
    use GetsCurrentShop;

    /* ─── Plans page ─────────────────────────────────────────────── */

    public function billing(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $plan = $shop->plan;

        $plans = Plan::orderBy('price')->get(['id', 'name', 'price', 'trial_days', 'monthly_credits', 'features']);

        $creditPacks = \App\Models\CreditPack::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'credits', 'price', 'per_credit_cost', 'is_popular']);

        return \Inertia\Inertia::render('Shopify/Billing', [
            'credits'     => $shop->ai_credits_balance ?? 0,
            'currentPlan' => $plan ? [
                'id'               => $plan->id,
                'name'             => $plan->name,
                'price'            => (float) $plan->price,
                'credits_per_month'=> (int) ($plan->monthly_credits ?? 0),
            ] : null,
            'plans' => $plans->map(fn ($p) => [
                'id'               => $p->id,
                'name'             => $p->name,
                'price'            => (float) $p->price,
                'trial_days'       => (int) ($p->trial_days ?? 0),
                'credits_per_month'=> (int) ($p->monthly_credits ?? 0),
                'features'         => $p->features ?? [],
            ])->values(),
            'creditPacks' => $creditPacks->map(fn ($pack) => [
                'id'              => $pack->id,
                'credits'         => $pack->credits,
                'price'           => (float) $pack->price,
                'per_credit_cost' => $pack->per_credit_cost ? (float) $pack->per_credit_cost : null,
                'is_popular'      => (bool) $pack->is_popular,
            ])->values(),
        ]);
    }

    /* ─── Subscribe to a recurring plan ─────────────────────────── */

    /**
     * Creates a Shopify recurring charge and returns the confirmation URL.
     *
     * Shopify billing requirements:
     * - Must use a valid offline access token (shpat_) for the API call.
     * - Development/test stores require charges with test: true.
     * - After merchant approves, Shopify redirects to return_url with charge_id.
     * - The charge must then be activated via a separate API call.
     */
    public function subscribe(Request $request): JsonResponse
    {
        Log::debug('[BillingController] Subscribe method called', [
            'method' => $request->method(),
            'path'   => $request->path(),
        ]);

        $shop = $this->currentShop($request);
        if (! $shop) {
            Log::error('[BillingController] No shop found');
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $planId = (int) $request->input('plan_id');
        $host   = (string) $request->input('host', '');

        $plan = Plan::find($planId);
        if (! $plan) {
            return response()->json(['error' => 'Plan not found'], 404);
        }

        Log::debug('[BillingController] Shop and plan found', [
            'shop'    => $shop->name,
            'plan_id' => $plan->id,
            'plan'    => $plan->name,
        ]);

        // ── Step 1: Exchange the Bearer session-token for a fresh offline token ────
        // Per-user (shpua_) tokens expire when the admin session ends. Exchanging
        // the current id_token gives us a permanent offline token (shpat_) that
        // works for server-side API calls like billing.
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $freshToken = $this->exchangeForOfflineToken($shop->getDomain()->toNative(), $bearerToken);
            if ($freshToken) {
                DB::table('merchants')->where('id', $shop->id)->update(['password' => $freshToken]);
                $shop->password   = $freshToken;
                $shop->apiHelper  = null; // reset cached helper so it uses the new token
                Log::debug('[BillingController] Token exchanged successfully');
            } else {
                Log::warning('[BillingController] Token exchange failed, using stored token');
            }
        }

        // ── Step 2: Build charge details ─────────────────────────────────────────
        // Non-production environments always set test=true.
        // Shopify REJECTS non-test charges on development stores.
        $isTest = ! app()->isProduction();

        $returnUrl = URL::secure('shopify/billing/callback') . '?' . http_build_query([
            'plan_id' => $plan->id,
            'shop'    => $shop->name,
            'host'    => $host,
        ]);

        // ── Step 3: Create the charge on Shopify ──────────────────────────────────
        // Use a direct REST call (same pattern as topUp) to avoid the library
        // wrapper sending unsupported fields (interval, null terms/capped_amount)
        // to the REST recurring_application_charges endpoint, which causes 422s.
        try {
            $chargePayload = [
                'recurring_application_charge' => [
                    'name'       => $plan->name,
                    'price'      => (float) $plan->price,
                    'return_url' => $returnUrl,
                    'test'       => $isTest,
                    'trial_days' => (int) ($plan->trial_days ?? 0),
                ],
            ];

            $apiVersion = config('shopify-app.api_version', '2025-10');
            $response   = $shop->api()->rest(
                'POST',
                "/admin/api/{$apiVersion}/recurring_application_charges.json",
                $chargePayload
            );

            if ($response['errors'] === true || empty($response['body']['recurring_application_charge']['confirmation_url'])) {
                $body = $response['body'] ?? null;
                $shopifyError = is_string($body) ? $body : json_encode($body);
                throw new \RuntimeException('Shopify billing failed: ' . $shopifyError);
            }

            $confirmationUrl = $response['body']['recurring_application_charge']['confirmation_url'];

            Log::debug('[BillingController] Confirmation URL obtained', ['url' => $confirmationUrl]);

            return response()->json(['confirmation_url' => $confirmationUrl]);
        } catch (\Throwable $e) {
            Log::error('[BillingController] Error generating confirmation URL', [
                'shop'    => $shop->name,
                'plan_id' => $planId,
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Could not generate billing URL. Please try again.'], 500);
        }
    }

    /* ─── Billing callback (after merchant approves on Shopify) ──── */

    /**
     * Shopify redirects here after the merchant accepts/declines on the
     * billing confirmation page. We activate the charge and set the plan.
     */
    public function billingCallback(Request $request, ActivatePlan $activatePlan): RedirectResponse
    {
        $shopDomain = $request->query('shop');
        $chargeId   = $request->query('charge_id');
        $planId     = (int) $request->query('plan_id');
        $host       = (string) $request->query('host', '');

        Log::debug('[BillingController] Billing callback received', [
            'shop'      => $shopDomain,
            'charge_id' => $chargeId,
            'plan_id'   => $planId,
        ]);

        if (! $chargeId || ! $shopDomain || ! $planId) {
            return redirect()->route('billing')->with('error', 'Billing was not completed.');
        }

        $shop = \App\Models\Merchant::where('name', $shopDomain)->first();
        if (! $shop) {
            return redirect('/')->with('error', 'Shop not found.');
        }

        try {
            $activatePlan(
                ShopId::fromNative($shop->id),
                PlanId::fromNative($planId),
                ChargeReference::fromNative((int) $chargeId),
                $host,
            );

            Log::info('[BillingController] Plan activated', [
                'shop'    => $shopDomain,
                'plan_id' => $planId,
            ]);

            // Redirect back into the embedded app
            $homeUrl = URL::secure('shopify') . '?' . http_build_query([
                'shop' => $shopDomain,
                'host' => $host,
            ]);

            return redirect($homeUrl)->with('success', 'Plan activated successfully!');
        } catch (\Throwable $e) {
            Log::error('[BillingController] Plan activation failed', [
                'shop'    => $shopDomain,
                'plan_id' => $planId,
                'error'   => $e->getMessage(),
            ]);

            return redirect()->route('billing')->with('error', 'Could not activate plan. Please contact support.');
        }
    }

    /* ─── One-time credit top-up ─────────────────────────────────── */

    /**
     * Credit top-ups are stored as Shopify ApplicationCharge (one-time).
     * We create the charge via REST and return the confirmation URL.
     */
    public function topUp(Request $request): JsonResponse
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $packId = (int) $request->input('pack_id');

        $pack = \App\Models\CreditPack::where('id', $packId)
            ->where('is_active', true)
            ->first();

        if (! $pack) {
            return response()->json(['error' => 'Invalid credit pack'], 422);
        }

        $redirectUrl = rtrim(config('app.url'), '/') . '/shopify/billing/topup/callback';

        try {
            $response = $shop->api()->rest('POST', '/admin/api/2025-10/application_charges.json', [
                'application_charge' => [
                    'name'         => number_format($pack->credits) . ' AI Credits',
                    'price'        => (float) $pack->price,
                    'return_url'   => $redirectUrl,
                    'test'         => ! app()->isProduction(),
                ],
            ]);

            $confirmationUrl = $response['body']['application_charge']['confirmation_url'] ?? null;
            if (! $confirmationUrl) {
                throw new \RuntimeException('Shopify did not return a confirmation URL');
            }

            // Stash pending pack in session so callback can credit it
            session([
                'pending_topup' => [
                    'pack_id'   => $packId,
                    'credits'   => $pack->credits,
                    'charge_id' => $response['body']['application_charge']['id'],
                    'shop'      => $shop->name,
                ],
            ]);

            return response()->json(['confirmation_url' => $confirmationUrl]);
        } catch (\Throwable $e) {
            Log::error('BillingController@topUp error', [
                'shop'    => $shop->name,
                'pack_id' => $packId,
                'error'   => $e->getMessage(),
            ]);

            return response()->json(['error' => 'Could not create charge. Please try again.'], 500);
        }
    }

    /* ─── Top-up callback (after merchant approves) ──────────────── */

    public function topUpCallback(Request $request): RedirectResponse
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            return redirect()->route('billing')->with('error', 'Session expired. Please try again.');
        }

        $pending = session('pending_topup');
        if (! $pending || $pending['shop'] !== $shop->name) {
            return redirect()->route('billing')->with('error', 'Invalid callback.');
        }

        // Verify charge is accepted
        $chargeId = $pending['charge_id'];
        $response = $shop->api()->rest('GET', "/admin/api/2025-10/application_charges/{$chargeId}.json");
        $status   = $response['body']['application_charge']['status'] ?? null;

        if ($status === 'accepted') {
            $shop->increment('ai_credits_balance', (int) $pending['credits']);
            session()->forget('pending_topup');
            return redirect()->route('billing')->with('success', "Added {$pending['credits']} credits to your account!");
        }

        return redirect()->route('billing')->with('error', 'Charge was not accepted.');
    }

    /* ─── Private helpers ────────────────────────────────────────── */

    /**
     * Exchange a Shopify session token (id_token from App Bridge) for a
     * permanent offline access token via Shopify's token exchange endpoint.
     *
     * Offline tokens never expire, making them safe for server-side API calls.
     * See: https://shopify.dev/docs/apps/auth/get-access-tokens/token-exchange
     */
    private function exchangeForOfflineToken(string $shopDomain, string $idToken): ?string
    {
        try {
            // Build a session with the shop domain so ApiHelper targets the right store.
            // No access token needed – the token exchange endpoint authenticates via
            // client_id + client_secret (loaded from SHOPIFY_API_KEY / SHOPIFY_API_SECRET).
            $session   = new Session($shopDomain, '');
            $apiHelper = resolve(IApiHelper::class)->make($session);
            $data      = $apiHelper->performOfflineTokenExchange($idToken);

            return $data['access_token'] ?? null;
        } catch (\Throwable $e) {
            Log::warning('[BillingController] Offline token exchange failed', [
                'shop'  => $shopDomain,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}

