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
        // Use test charges for non-production by default, with env override support.
        // This prevents Shopify dev stores from showing unavailable billing screens.
        $isTest = $this->shouldUseTestCharges($shop);

        Log::debug('[BillingController] Billing mode selected', [
            'shop'    => $shop->name,
            'is_test' => $isTest,
        ]);

        $returnUrl = URL::secure('shopify/billing/callback') . '?' . http_build_query([
            'plan_id' => $plan->id,
            'shop'    => $shop->name,
            'host'    => $host,
        ]);

        // ── Step 3: Create the subscription via GraphQL (appSubscriptionCreate) ───
        // Shopify recommends GraphQL over the deprecated REST billing endpoints.
        // Docs: https://shopify.dev/docs/api/admin-graphql/latest/mutations/appSubscriptionCreate
        //
        // NOTE: This requires the app to be registered in the Shopify Partners
        // dashboard. Custom/shop-owned apps cannot use the billing API at all.
        try {
            $query = <<<'GQL'
            mutation appSubscriptionCreate(
                $name: String!,
                $returnUrl: URL!,
                $trialDays: Int,
                $test: Boolean,
                $lineItems: [AppSubscriptionLineItemInput!]!
            ) {
                appSubscriptionCreate(
                    name: $name,
                    returnUrl: $returnUrl,
                    trialDays: $trialDays,
                    test: $test,
                    lineItems: $lineItems
                ) {
                    appSubscription { id }
                    confirmationUrl
                    userErrors { field message }
                }
            }
            GQL;

            $variables = [
                'name'      => $plan->name,
                'returnUrl' => $returnUrl,
                'trialDays' => (int) ($plan->trial_days ?? 0),
                'test'      => $isTest,
                'lineItems' => [[
                    'plan' => [
                        'appRecurringPricingDetails' => [
                            'price'    => [
                                'amount'       => number_format((float) $plan->price, 2, '.', ''),
                                'currencyCode' => 'USD',
                            ],
                            'interval' => 'EVERY_30_DAYS',
                        ],
                    ],
                ]],
            ];

            $response  = $shop->api()->graph($query, $variables);
            $gqlErrors = $response['errors'] ?? false;

            if ($gqlErrors !== false) {
                $msg = is_array($gqlErrors) ? json_encode($gqlErrors) : $gqlErrors;
                throw new \RuntimeException('GraphQL error: ' . $msg);
            }

            // Shopify GraphQL can return API-level errors inside body.errors.
            $bodyErrors = $response['body']['errors'] ?? null;
            if (is_array($bodyErrors) && count($bodyErrors) > 0) {
                throw new \RuntimeException('GraphQL body errors: ' . json_encode($bodyErrors));
            }

            $result     = $response['body']['data']['appSubscriptionCreate'] ?? [];
            $userErrors = $result['userErrors'] ?? [];

            if (is_array($userErrors)) {
                $userErrorMessages = collect($userErrors)
                    ->pluck('message')
                    ->filter(fn ($msg) => is_string($msg) && trim($msg) !== '')
                    ->values()
                    ->all();

                if (count($userErrorMessages) > 0) {
                    throw new \RuntimeException('Shopify error: ' . implode(' | ', $userErrorMessages));
                }
            }

            $confirmationUrl = $result['confirmationUrl'] ?? null;
            if (! $confirmationUrl) {
                Log::error('[BillingController] Missing confirmationUrl in appSubscriptionCreate response', [
                    'shop'     => $shop->name,
                    'plan_id'  => $planId,
                    'response' => $response['body'] ?? null,
                ]);
                throw new \RuntimeException('Shopify did not return a confirmationUrl');
            }

            Log::debug('[BillingController] Confirmation URL obtained', ['url' => $confirmationUrl]);

            return response()->json(['confirmation_url' => $confirmationUrl]);
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();
            $publicError  = 'Could not generate billing URL. Please try again.';

            // Shopify returns this when the app/store install context is not eligible for billing.
            if (str_contains($errorMessage, 'currently owned by a Shop')) {
                $publicError = 'Billing is blocked by Shopify for this install context. Reinstall the app from Shopify Partners and try again.';
            }

            Log::error('[BillingController] Error generating confirmation URL', [
                'shop'    => $shop->name,
                'plan_id' => $planId,
                'error'   => $errorMessage,
                'trace'   => $e->getTraceAsString(),
            ]);

            $response = ['error' => $publicError];
            if (config('app.debug')) {
                $response['debug_error'] = $errorMessage;
            }

            return response()->json($response, 500);
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
     * Credit top-ups use Shopify one-time charges (appPurchaseOneTimeCreate).
     * We create the charge via GraphQL and return the confirmation URL.
     * Docs: https://shopify.dev/docs/api/admin-graphql/latest/mutations/appPurchaseOneTimeCreate
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
            $query = <<<'GQL'
            mutation appPurchaseOneTimeCreate(
                $name: String!,
                $returnUrl: URL!,
                $price: MoneyInput!,
                $test: Boolean
            ) {
                appPurchaseOneTimeCreate(
                    name: $name,
                    returnUrl: $returnUrl,
                    price: $price,
                    test: $test
                ) {
                    appPurchaseOneTime { id }
                    confirmationUrl
                    userErrors { field message }
                }
            }
            GQL;

            $variables = [
                'name'      => number_format($pack->credits) . ' AI Credits',
                'returnUrl' => $redirectUrl,
                'price'     => [
                    'amount'       => number_format((float) $pack->price, 2, '.', ''),
                    'currencyCode' => 'USD',
                ],
                'test'      => $this->shouldUseTestCharges($shop),
            ];

            $response  = $shop->api()->graph($query, $variables);
            $gqlErrors = $response['errors'] ?? false;

            if ($gqlErrors !== false) {
                $msg = is_array($gqlErrors) ? json_encode($gqlErrors) : $gqlErrors;
                throw new \RuntimeException('GraphQL error: ' . $msg);
            }

            $bodyErrors = $response['body']['errors'] ?? null;
            if (is_array($bodyErrors) && count($bodyErrors) > 0) {
                throw new \RuntimeException('GraphQL body errors: ' . json_encode($bodyErrors));
            }

            $result     = $response['body']['data']['appPurchaseOneTimeCreate'] ?? [];
            $userErrors = $result['userErrors'] ?? [];

            if (is_array($userErrors)) {
                $userErrorMessages = collect($userErrors)
                    ->pluck('message')
                    ->filter(fn ($msg) => is_string($msg) && trim($msg) !== '')
                    ->values()
                    ->all();

                if (count($userErrorMessages) > 0) {
                    throw new \RuntimeException('Shopify error: ' . implode(' | ', $userErrorMessages));
                }
            }

            $confirmationUrl = $result['confirmationUrl'] ?? null;
            if (! $confirmationUrl) {
                Log::error('BillingController@topUp missing confirmationUrl', [
                    'shop'     => $shop->name,
                    'pack_id'  => $packId,
                    'response' => $response['body'] ?? null,
                ]);
                throw new \RuntimeException('Shopify did not return a confirmationUrl');
            }

            // Extract integer charge ID from the GID (gid://shopify/AppPurchaseOneTime/12345)
            $gid      = $result['appPurchaseOneTime']['id'] ?? '';
            $chargeId = (int) substr($gid, strrpos($gid, '/') + 1);

            // Stash pending pack in session so callback can credit it
            session([
                'pending_topup' => [
                    'pack_id'   => $packId,
                    'credits'   => $pack->credits,
                    'charge_id' => $chargeId,
                    'shop'      => $shop->name,
                ],
            ]);

            return response()->json(['confirmation_url' => $confirmationUrl]);
        } catch (\Throwable $e) {
            $errorMessage = $e->getMessage();
            $publicError  = 'Could not create charge. Please try again.';

            if (str_contains($errorMessage, 'currently owned by a Shop')) {
                $publicError = 'Credit-pack billing is blocked by Shopify for this install context. Reinstall the app from Shopify Partners and try again.';
            }

            Log::error('BillingController@topUp error', [
                'shop'    => $shop->name,
                'pack_id' => $packId,
                'error'   => $errorMessage,
            ]);

            $response = ['error' => $publicError];
            if (config('app.debug')) {
                $response['debug_error'] = $errorMessage;
            }

            return response()->json($response, 500);
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

    /**
     * Decide whether billing calls should be created as test charges.
     *
     * Rules:
     * - Non-production always uses test charges.
     * - `SHOPIFY_FORCE_TEST_CHARGES=true` forces test charges in any env.
     * - In production, try to detect partner development stores via GraphQL.
     */
    private function shouldUseTestCharges($shop): bool
    {
        if (! app()->isProduction()) {
            return true;
        }

        if (filter_var((string) env('SHOPIFY_FORCE_TEST_CHARGES', false), FILTER_VALIDATE_BOOL)) {
            return true;
        }

        try {
            $response = $shop->api()->graph('query { shop { plan { partnerDevelopment } } }');
            $partnerDevelopment = data_get($response, 'body.data.shop.plan.partnerDevelopment');

            if (is_bool($partnerDevelopment)) {
                return $partnerDevelopment;
            }
        } catch (\Throwable $e) {
            Log::warning('[BillingController] Could not detect shop plan type for test billing decision', [
                'shop'  => $shop->name,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }
}

