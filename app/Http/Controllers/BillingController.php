<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    use GetsCurrentShop;

    public function billing(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $plan = $shop->plan;

        return \Inertia\Inertia::render('Shopify/Billing', [
            'credits' => $shop->ai_credits_balance ?? 0,
            'currentPlan' => $plan ? [
                'name' => $plan->name,
                'price' => $plan->price ?? 0,
                'credits_per_month' => $plan->monthly_credits ?? 0,
            ] : null,
        ]);
    }
}
