<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImageGeneration;
use App\Models\Merchant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AnalyticsController extends Controller
{
    public function __invoke(Request $request)
    {
        $days = min(90, max(7, (int) $request->get('days', 30)));
        $start = now()->subDays($days)->startOfDay();
        $end = now()->endOfDay();

        // ── Merchant growth (signups per day) ─────────────────────────────────
        $merchantGrowth = Merchant::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('date(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'count' => (int) $r->count])
            ->toArray();

        // ── AI Studio usage (completed + failed per day, from ImageGeneration) ─
        $aiUsageByDay = ImageGeneration::query()
            ->where('created_at', '>=', $start)
            ->selectRaw("date(created_at) as date, sum(case when status = 'completed' then 1 else 0 end) as completed, sum(case when status = 'failed' then 1 else 0 end) as failed")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'completed' => (int) $r->completed, 'failed' => (int) $r->failed])
            ->toArray();

        // Fill missing dates with zeros
        $allDates = collect();
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $allDates->push($d->format('Y-m-d'));
        }
        $usageMap = collect($aiUsageByDay)->keyBy('date');
        $aiUsageByDay = $allDates->map(fn ($date) => [
            'date' => $date,
            'completed' => $usageMap->get($date)['completed'] ?? 0,
            'failed' => $usageMap->get($date)['failed'] ?? 0,
        ])->toArray();

        $growthMap = collect($merchantGrowth)->keyBy('date');
        $merchantGrowth = $allDates->map(fn ($date) => [
            'date' => $date,
            'count' => $growthMap->get($date)['count'] ?? 0,
        ])->toArray();

        // ── KPIs ─────────────────────────────────────────────────────────────
        $totalMerchants = Merchant::count();
        $newMerchantsInPeriod = Merchant::where('created_at', '>=', $start)->count();
        $totalAiCompleted = ImageGeneration::where('status', 'completed')->whereNotNull('result_image_url')->where('created_at', '>=', $start)->count();
        $totalAiFailed = ImageGeneration::where('status', 'failed')->where('created_at', '>=', $start)->count();
        $totalAiRuns = $totalAiCompleted + $totalAiFailed;
        $failureRate = $totalAiRuns > 0 ? round(100 * $totalAiFailed / $totalAiRuns, 1) : 0;
        $activeMerchantsInPeriod = (int) ImageGeneration::where('created_at', '>=', $start)->distinct()->count('shop_domain');
        $merchantsWithPlan = Merchant::whereNotNull('plan_id')->count();
        $totalCreditsIssued = (int) Merchant::sum('ai_credits_balance');
        $creditsConsumedInPeriod = ImageGeneration::where('created_at', '>=', $start)
            ->where('tool_used', '!=', 'compressor')
            ->whereIn('status', ['completed', 'failed'])
            ->count();

        // ── Top merchants by AI usage (all time or period) ────────────────────
        $topMerchantsByUsage = ImageGeneration::query()
            ->where('created_at', '>=', $start)
            ->where('status', 'completed')
            ->selectRaw('shop_domain, count(*) as runs')
            ->groupBy('shop_domain')
            ->orderByDesc('runs')
            ->limit(15)
            ->get()
            ->map(fn ($r) => ['shop_domain' => $r->shop_domain ?: '—', 'runs' => (int) $r->runs])
            ->toArray();

        // ── Plan distribution ─────────────────────────────────────────────────
        $planDistribution = Merchant::query()
            ->leftJoin('plans', 'merchants.plan_id', '=', 'plans.id')
            ->selectRaw('coalesce(plans.name, "Free") as plan_name, count(*) as count')
            ->groupBy(DB::raw('coalesce(plans.name, "Free")'))
            ->get()
            ->map(fn ($r) => ['plan_name' => $r->plan_name ?? 'Free', 'count' => (int) $r->count])
            ->toArray();

        // ── AI runs by tool (period) ─────────────────────────────────────────
        $aiRunsByTool = ImageGeneration::query()
            ->where('created_at', '>=', $start)
            ->whereIn('status', ['completed', 'failed'])
            ->selectRaw('tool_used, status, count(*) as cnt')
            ->groupBy('tool_used', 'status')
            ->get();

        $byTool = [];
        foreach ($aiRunsByTool as $r) {
            $key = $r->tool_used;
            if (! isset($byTool[$key])) {
                $byTool[$key] = ['tool_used' => $key, 'completed' => 0, 'failed' => 0];
            }
            $byTool[$key][$r->status] = (int) $r->cnt;
        }
        $aiRunsByTool = array_values($byTool);

        // ── Recent failures (last 10) ─────────────────────────────────────────
        $recentFailures = ImageGeneration::query()
            ->where('status', 'failed')
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get(['id', 'shop_domain', 'tool_used', 'error_message', 'created_at'])
            ->map(fn ($r) => [
                'id' => $r->id,
                'shop_domain' => $r->shop_domain,
                'tool_used' => $r->tool_used,
                'error_message' => $r->error_message ? substr($r->error_message, 0, 120) : '—',
                'created_at' => $r->created_at?->toIso8601String(),
            ])
            ->toArray();

        return Inertia::render('Admin/Pages/Analytics', [
            'days' => $days,
            'merchantGrowth' => $merchantGrowth,
            'aiUsageByDay' => $aiUsageByDay,
            'kpis' => [
                'totalMerchants' => $totalMerchants,
                'newMerchantsInPeriod' => $newMerchantsInPeriod,
                'activeMerchantsInPeriod' => $activeMerchantsInPeriod,
                'totalAiCompleted' => $totalAiCompleted,
                'totalAiFailed' => $totalAiFailed,
                'totalAiRuns' => $totalAiRuns,
                'failureRate' => $failureRate,
                'merchantsWithPlan' => $merchantsWithPlan,
                'totalCreditsIssued' => $totalCreditsIssued,
                'creditsConsumedInPeriod' => $creditsConsumedInPeriod,
            ],
            'topMerchantsByUsage' => $topMerchantsByUsage,
            'planDistribution' => $planDistribution,
            'aiRunsByTool' => $aiRunsByTool,
            'recentFailures' => $recentFailures,
        ]);
    }
}
