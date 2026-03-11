<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PlanController extends Controller
{
    /* ─── Index ─────────────────────────────────────────────────── */

    public function index()
    {
        $plans = Plan::orderBy('price')->get()->map(fn (Plan $p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'type'           => $p->type,
            'price'          => (float) $p->price,
            'trial_days'     => (int) ($p->trial_days ?? 0),
            'monthly_credits'=> (int) ($p->monthly_credits ?? 0),
            'on_install'     => (bool) $p->on_install,
            'test'           => (bool) $p->test,
            'capped_amount'  => $p->capped_amount ? (float) $p->capped_amount : null,
            'terms'          => $p->terms,
            'merchants_count'=> Merchant::where('plan_id', $p->id)->count(),
        ])->values();

        $stats = [
            'total_plans'   => $plans->count(),
            'paid_plans'    => $plans->where('price', '>', 0)->count(),
            'total_merchants_on_plans' => Merchant::whereNotNull('plan_id')->count(),
        ];

        return Inertia::render('Admin/Pages/Plans/Index', [
            'plans' => $plans,
            'stats' => $stats,
        ]);
    }

    /* ─── Store ──────────────────────────────────────────────────── */

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100', Rule::unique('plans', 'name')],
            'type'            => ['required', Rule::in(['RECURRING', 'ONCE'])],
            'price'           => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'trial_days'      => ['nullable', 'integer', 'min:0', 'max:30'],
            'monthly_credits' => ['required', 'integer', 'min:0'],
            'on_install'      => ['boolean'],
            'test'            => ['boolean'],
            'capped_amount'   => ['nullable', 'numeric', 'min:0'],
            'terms'           => ['nullable', 'string', 'max:255'],
        ]);

        // Prevent multiple on_install plans
        if (! empty($data['on_install'])) {
            Plan::where('on_install', true)->update(['on_install' => false]);
        }

        Plan::create([
            'name'            => $data['name'],
            'type'            => $data['type'],
            'price'           => $data['price'],
            'trial_days'      => $data['trial_days'] ?? 0,
            'monthly_credits' => $data['monthly_credits'],
            'on_install'      => $data['on_install'] ?? false,
            'test'            => $data['test'] ?? false,
            'capped_amount'   => $data['capped_amount'] ?? null,
            'terms'           => $data['terms'] ?? null,
        ]);

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan "' . $data['name'] . '" created successfully.');
    }

    /* ─── Update ─────────────────────────────────────────────────── */

    public function update(Request $request, int $id)
    {
        $plan = Plan::findOrFail($id);

        $data = $request->validate([
            'name'            => ['required', 'string', 'max:100', Rule::unique('plans', 'name')->ignore($plan->id)],
            'type'            => ['required', Rule::in(['RECURRING', 'ONCE'])],
            'price'           => ['required', 'numeric', 'min:0', 'max:9999.99'],
            'trial_days'      => ['nullable', 'integer', 'min:0', 'max:30'],
            'monthly_credits' => ['required', 'integer', 'min:0'],
            'on_install'      => ['boolean'],
            'test'            => ['boolean'],
            'capped_amount'   => ['nullable', 'numeric', 'min:0'],
            'terms'           => ['nullable', 'string', 'max:255'],
        ]);

        // Check if critical fields are being changed
        $priceChanged = (float) $plan->price !== (float) $data['price'];
        $creditsChanged = (int) $plan->monthly_credits !== (int) $data['monthly_credits'];
        $trialChanged = (int) ($plan->trial_days ?? 0) !== (int) ($data['trial_days'] ?? 0);

        // Prevent multiple on_install plans
        if (! empty($data['on_install']) && ! $plan->on_install) {
            Plan::where('on_install', true)->where('id', '!=', $plan->id)->update(['on_install' => false]);
        }

        $plan->update([
            'name'            => $data['name'],
            'type'            => $data['type'],
            'price'           => $data['price'],
            'trial_days'      => $data['trial_days'] ?? 0,
            'monthly_credits' => $data['monthly_credits'],
            'on_install'      => $data['on_install'] ?? false,
            'test'            => $data['test'] ?? false,
            'capped_amount'   => $data['capped_amount'] ?? null,
            'terms'           => $data['terms'] ?? null,
        ]);

        // Build success message with warning if critical fields changed
        $successMessage = 'Plan "' . $plan->name . '" updated successfully.';
        
        if ($priceChanged || $creditsChanged || $trialChanged) {
            $activeCount = Merchant::where('plan_id', $plan->id)->count();
            if ($activeCount > 0) {
                $successMessage .= ' Note: ' . $activeCount . ' existing merchant subscription(s) will keep their original terms. Only new subscriptions will use the updated plan details.';
            }
        }

        return redirect()->route('admin.plans.index')
            ->with('success', $successMessage);
    }

    /* ─── Destroy ────────────────────────────────────────────────── */

    public function destroy(int $id)
    {
        $plan = Plan::findOrFail($id);

        $activeCount = Merchant::where('plan_id', $plan->id)->count();
        if ($activeCount > 0) {
            return redirect()->route('admin.plans.index')
                ->with('error', 'Cannot delete "' . $plan->name . '" — ' . $activeCount . ' merchant(s) are on this plan.');
        }

        $name = $plan->name;
        $plan->delete();

        return redirect()->route('admin.plans.index')
            ->with('success', 'Plan "' . $name . '" deleted.');
    }
}
