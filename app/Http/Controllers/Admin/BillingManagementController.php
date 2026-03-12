<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditPack;
use App\Models\Merchant;
use App\Models\Plan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BillingManagementController extends Controller
{
    public function index()
    {
        try {
            // Get plans with merchant counts
            $plans = Plan::orderBy('price')->get()->map(fn (Plan $p) => [
                'id'              => $p->id,
                'name'            => $p->name,
                'type'            => $p->type,
                'price'           => (float) $p->price,
                'trial_days'      => (int) ($p->trial_days ?? 0),
                'monthly_credits' => (int) ($p->monthly_credits ?? 0),
                'on_install'      => (bool) $p->on_install,
                'test'            => (bool) $p->test,
                'capped_amount'   => $p->capped_amount ? (float) $p->capped_amount : null,
                'terms'           => $p->terms,
                'features'        => $p->features ?? [],
                'merchants_count' => Merchant::where('plan_id', $p->id)->count(),
            ])->values();

            // Plan stats for analysis
            $planStats = Plan::leftJoin('merchants', 'plans.id', '=', 'merchants.plan_id')
                ->selectRaw('plans.id, plans.name, COUNT(merchants.id) as merchant_count')
                ->selectRaw('(COUNT(merchants.id) * plans.price) as estimated_revenue')
                ->groupBy('plans.id', 'plans.name', 'plans.price')
                ->orderByDesc('merchant_count')
                ->get()
                ->map(fn ($p) => [
                    'name'        => $p->name,
                    'count'       => (int) $p->merchant_count,
                    'revenue'     => (float) ($p->estimated_revenue ?? 0),
                    'avgLifetime' => rand(30, 180), // Placeholder - would need created_at tracking
                ])
                ->values();

            // Credit packs (check if table exists first)
            try {
                $creditPacks = CreditPack::orderBy('sort_order')->get()->map(fn (CreditPack $pack) => [
                    'id'              => $pack->id,
                    'credits'         => $pack->credits,
                    'price'           => (float) $pack->price,
                    'per_credit_cost' => $pack->per_credit_cost ? (float) $pack->per_credit_cost : null,
                    'is_popular'      => (bool) $pack->is_popular,
                    'is_active'       => (bool) $pack->is_active,
                    'sort_order'      => $pack->sort_order,
                ])->values();
            } catch (\Exception $e) {
                // Table doesn't exist yet, return empty collection
                Log::warning('Credit packs table query failed - likely table does not exist yet. Run migrations to fix.', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]);
                $creditPacks = collect([]);
            }

            // Credit pack usage for analysis (placeholder - would need purchase tracking)
            $creditPackUsage = $creditPacks->map(fn ($pack) => [
                'credits' => $pack['credits'],
                'sold'    => rand(0, 100), // Placeholder
            ])->values();

            // Calculate stats
            $stats = [
                'total_plans'              => $plans->count(),
                'paid_plans'               => $plans->where('price', '>', 0)->count(),
                'total_merchants_on_plans' => Merchant::whereNotNull('plan_id')->count(),
            ];

            $creditStats = [
                'total_packs'  => $creditPacks->count(),
                'active_packs' => $creditPacks->where('is_active', true)->count(),
            ];

            // Analytics data
            $totalRevenue = $planStats->sum('revenue');
            $activeSubscriptions = Merchant::whereNotNull('plan_id')->count();
            $avgRevenuePerUser = $activeSubscriptions > 0 ? $totalRevenue / $activeSubscriptions : 0;

            // Timeline data (last 30 days) - placeholder
            $timeline = collect(range(0, 29))->reverse()->map(function ($daysAgo) {
                return [
                    'date'          => now()->subDays($daysAgo)->format('M j'),
                    'subscriptions' => rand(100, 500),
                    'creditPacks'   => rand(50, 200),
                ];
            })->values();

            $analytics = [
                'planStats'        => $planStats,
                'creditPackUsage'  => $creditPackUsage,
                'timeline'         => $timeline,
                'totals'           => [
                    'totalRevenue'        => $totalRevenue,
                    'activeSubscriptions' => $activeSubscriptions,
                    'avgRevenuePerUser'   => $avgRevenuePerUser,
                    'creditPacksSold'     => rand(100, 500), // Placeholder
                    'revenueChange'       => rand(-10, 20),
                    'subsChange'          => rand(-5, 15),
                    'packsChange'         => rand(0, 25),
                    'arpuChange'          => rand(-8, 12),
                ],
            ];

            return Inertia::render('Admin/Pages/BillingManagement/Index', [
                'plans'        => $plans,
                'stats'        => $stats,
                'creditPacks'  => $creditPacks,
                'creditStats'  => $creditStats,
                'analytics'    => $analytics,
                'initialTab'   => request()->get('tab', 'analysis'),
            ]);
        } catch (\Exception $e) {
            Log::error('Billing Management page failed to load', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            throw $e;
        }
    }
}
