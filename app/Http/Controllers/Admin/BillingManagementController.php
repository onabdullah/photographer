<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditPack;
use App\Models\Merchant;
use App\Models\Plan;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BillingManagementController extends Controller
{
    /**
     * Charge type constants (from osiset/laravel-shopify ChargeType enum)
     */
    private const CHARGE_TYPE_RECURRING = 1;
    private const CHARGE_TYPE_ONETIME   = 2;

    /**
     * Charge status constants (from osiset/laravel-shopify ChargeStatus enum)
     */
    private const CHARGE_STATUS_ACTIVE    = 0;
    private const CHARGE_STATUS_ACCEPTED  = 1;
    private const CHARGE_STATUS_CANCELLED = 3;

    public function index()
    {
        try {
            // ── Plans with per-plan merchant counts ────────────────────────
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

            // ── Credit packs ───────────────────────────────────────────────
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
                Log::warning('Credit packs table query failed.', [
                    'error' => $e->getMessage(),
                ]);
                $creditPacks = collect([]);
            }

            // ── Stats ──────────────────────────────────────────────────────
            $stats = [
                'total_plans'              => $plans->count(),
                'paid_plans'               => $plans->where('price', '>', 0)->count(),
                'total_merchants_on_plans' => Merchant::whereNotNull('plan_id')->count(),
            ];

            $creditStats = [
                'total_packs'  => $creditPacks->count(),
                'active_packs' => $creditPacks->where('is_active', true)->count(),
            ];

            // ── Analytics ─────────────────────────────────────────────────
            $analytics = $this->buildAnalytics($plans, $creditPacks);

            return Inertia::render('Admin/Pages/BillingManagement/Index', [
                'plans'       => $plans,
                'stats'       => $stats,
                'creditPacks' => $creditPacks,
                'creditStats' => $creditStats,
                'analytics'   => $analytics,
                'initialTab'  => request()->get('tab', 'analysis'),
            ]);
        } catch (\Exception $e) {
            Log::error('Billing Management page failed to load', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ]);
            throw $e;
        }
    }

    /**
     * Build all analytics data from real database queries.
     */
    private function buildAnalytics($plans, $creditPacks): array
    {
        $now           = Carbon::now();
        $thisMonthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonth()->startOfMonth();
        $lastMonthEnd   = $now->copy()->subMonth()->endOfMonth();

        // ── Plan distribution: merchants per plan (real counts) ────────────
        $planStats = Plan::leftJoin('merchants', 'plans.id', '=', 'merchants.plan_id')
            ->selectRaw('plans.id, plans.name, plans.price, COUNT(merchants.id) as merchant_count')
            ->groupBy('plans.id', 'plans.name', 'plans.price')
            ->orderByDesc('merchant_count')
            ->get()
            ->map(fn ($p) => [
                'name'    => $p->name,
                'count'   => (int) $p->merchant_count,
                'revenue' => round((float) $p->price * (int) $p->merchant_count, 2),
            ])
            ->values();

        // ── Active subscriptions (merchants on a paid plan) ────────────────
        $paidPlanIds = $plans->where('price', '>', 0)->pluck('id');
        $activeSubscriptions = Merchant::whereIn('plan_id', $paidPlanIds)->count();

        // ── Revenue from active recurring charges ──────────────────────────
        // Use the charges table (type=1 RECURRING, status=0 ACTIVE) for MRR.
        // This reflects the actual charges that have been activated via Shopify.
        $activeChargesRevenue = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_RECURRING)
            ->where('status', self::CHARGE_STATUS_ACTIVE)
            ->whereNull('deleted_at')
            ->sum('price');

        // Fall back to plan-based estimate if no charges exist yet.
        $totalRevenue = $activeChargesRevenue > 0
            ? (float) $activeChargesRevenue
            : (float) $planStats->sum('revenue');

        // ── One-time charges (credit pack top-ups via Shopify) ─────────────
        $creditPacksSold = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_ONETIME)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->count();

        // Credit pack usage: count one-time charges whose name matches each pack
        $creditPackUsage = $creditPacks->map(function ($pack) {
            $sold = DB::table('charges')
                ->where('type', self::CHARGE_TYPE_ONETIME)
                ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
                ->whereNull('deleted_at')
                ->where('name', 'like', '%' . number_format((int) $pack['credits']) . '%')
                ->count();

            return [
                'credits' => $pack['credits'],
                'sold'    => $sold,
            ];
        })->values();

        // ── ARPU ───────────────────────────────────────────────────────────
        $avgRevenuePerUser = $activeSubscriptions > 0
            ? round($totalRevenue / $activeSubscriptions, 2)
            : 0.0;

        // ── Month-over-month change percentages ────────────────────────────
        // Revenue change: active subscription revenue this month vs last month
        $revenueThisMonth = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_RECURRING)
            ->where('status', self::CHARGE_STATUS_ACTIVE)
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $thisMonthStart)
            ->sum('price');

        $revenueLastMonth = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_RECURRING)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->sum('price');

        $revenueChange = $revenueLastMonth > 0
            ? (int) round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100)
            : 0;

        // Subscription change: new merchants on paid plans this month vs last month
        $subsThisMonth = Merchant::whereIn('plan_id', $paidPlanIds)
            ->where('created_at', '>=', $thisMonthStart)
            ->count();

        $subsLastMonth = Merchant::whereIn('plan_id', $paidPlanIds)
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $subsChange = $subsLastMonth > 0
            ? (int) round((($subsThisMonth - $subsLastMonth) / $subsLastMonth) * 100)
            : 0;

        // Credit packs change: one-time charges this month vs last month
        $packsThisMonth = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_ONETIME)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $thisMonthStart)
            ->count();

        $packsLastMonth = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_ONETIME)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->whereBetween('created_at', [$lastMonthStart, $lastMonthEnd])
            ->count();

        $packsChange = $packsLastMonth > 0
            ? (int) round((($packsThisMonth - $packsLastMonth) / $packsLastMonth) * 100)
            : 0;

        // ARPU change vs last month
        $activePaidLastMonth = Merchant::whereIn('plan_id', $paidPlanIds)
            ->where('created_at', '<=', $lastMonthEnd)
            ->count();

        $arpuLastMonth = ($activePaidLastMonth > 0 && $revenueLastMonth > 0)
            ? round($revenueLastMonth / $activePaidLastMonth, 2)
            : 0.0;

        $arpuChange = $arpuLastMonth > 0
            ? (int) round((($avgRevenuePerUser - $arpuLastMonth) / $arpuLastMonth) * 100)
            : 0;

        // ── Revenue timeline: last 30 days ─────────────────────────────────
        $recurringByDay = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_RECURRING)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $now->copy()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as date, SUM(price) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $onetimeByDay = DB::table('charges')
            ->where('type', self::CHARGE_TYPE_ONETIME)
            ->whereIn('status', [self::CHARGE_STATUS_ACTIVE, self::CHARGE_STATUS_ACCEPTED])
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $now->copy()->subDays(29)->startOfDay())
            ->selectRaw('DATE(created_at) as date, SUM(price) as total')
            ->groupBy('date')
            ->pluck('total', 'date');

        $timeline = collect(range(0, 29))->reverse()->map(function ($daysAgo) use ($now, $recurringByDay, $onetimeByDay) {
            $date = $now->copy()->subDays($daysAgo)->format('Y-m-d');
            return [
                'date'        => $now->copy()->subDays($daysAgo)->format('M j'),
                'subscriptions' => (float) ($recurringByDay[$date] ?? 0),
                'creditPacks'   => (float) ($onetimeByDay[$date] ?? 0),
            ];
        })->values();

        return [
            'planStats'       => $planStats,
            'creditPackUsage' => $creditPackUsage,
            'timeline'        => $timeline,
            'totals'          => [
                'totalRevenue'        => round($totalRevenue, 2),
                'activeSubscriptions' => $activeSubscriptions,
                'avgRevenuePerUser'   => $avgRevenuePerUser,
                'creditPacksSold'     => $creditPacksSold,
                'revenueChange'       => $revenueChange,
                'subsChange'          => $subsChange,
                'packsChange'         => $packsChange,
                'arpuChange'          => $arpuChange,
            ],
        ];
    }
}
