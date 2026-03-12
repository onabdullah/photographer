<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Actions\GetPlanUrl;
use Osiset\ShopifyApp\Objects\Values\NullablePlanId;
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
     * Returns the Shopify billing confirmation URL for the requested plan.
     * The frontend calls this via redirect: window.open(url) or App Bridge redirect.
     */
    public function subscribe(Request $request, GetPlanUrl $getPlanUrl): JsonResponse
    {
        Log::debug('[BillingController] Subscribe method called', [
            'method' => $request->method(),
            'path' => $request->path(),
            'headers' => $request->headers->all(),
        ]);

        $shop = $this->currentShop($request);
        if (! $shop) {
            Log::error('[BillingController] No shop found');
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        Log::debug('[BillingController] Shop found', ['shop' => $shop->name]);

        $planId = (int) $request->input('plan_id');
        $host   = (string) $request->input('host', '');

        Log::debug('[BillingController] Request params', [
            'plan_id' => $planId,
            'host' => $host,
        ]);

        $plan = Plan::find($planId);
        if (! $plan) {
            Log::error('[BillingController] Plan not found', ['plan_id' => $planId]);
            return response()->json(['error' => 'Plan not found'], 404);
        }

        Log::debug('[BillingController] Plan found', [
            'plan_id' => $plan->id,
            'plan_name' => $plan->name,
        ]);

        Log::debug('[BillingController] Token check', [
            'has_password' => ! empty($shop->password),
            'token_prefix' => $shop->password ? substr($shop->password, 0, 8) . '...' : 'EMPTY',
        ]);

        try {
            $url = $getPlanUrl(
                ShopId::fromNative($shop->getId()->toNative()),
                NullablePlanId::fromNative($planId),
                $host,
            );

            Log::debug('[BillingController] Confirmation URL generated', [
                'url' => $url,
            ]);

            return response()->json(['confirmation_url' => $url]);
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
                    'test'         => (bool) env('SHOPIFY_TEST_CHARGES', true),
                ],
            ]);

            $confirmationUrl = $response['body']['application_charge']['confirmation_url'] ?? null;
            if (! $confirmationUrl) {
                throw new \RuntimeException('Shopify did not return a confirmation URL');
            }

            // Stash pending pack in session so callback can credit it
            session([
                'pending_topup' => [
                    'pack_id'    => $packId,
                    'credits'    => $pack->credits,
                    'charge_id'  => $response['body']['application_charge']['id'],
                    'shop'       => $shop->name,
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

    public function topUpCallback(Request $request): \Illuminate\Http\RedirectResponse
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
}
