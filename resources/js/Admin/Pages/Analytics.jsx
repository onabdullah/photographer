import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import {
    BarChart3,
    Store,
    UserPlus,
    Zap,
    AlertTriangle,
    CreditCard,
    TrendingUp,
    PieChart,
    Activity,
    ExternalLink,
} from 'lucide-react';

const TOOL_LABELS = {
    magic_eraser: 'Magic Eraser',
    background_remover: 'Background Remover',
    compressor: 'Image Compressor',
    upscaler: 'Upscaler',
    enhance: 'Image Enhancer',
    lighting: 'Lighting Fix',
};

const PERIOD_OPTIONS = [7, 30, 90];

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Analytics({
    days = 30,
    merchantGrowth = [],
    aiUsageByDay = [],
    kpis = {},
    topMerchantsByUsage = [],
    planDistribution = [],
    aiRunsByTool = [],
    recentFailures = [],
}) {
    const [period, setPeriod] = useState(days);

    const applyPeriod = (d) => {
        setPeriod(d);
        router.get('/admin/analytics', { days: d }, { preserveState: false });
    };

    const k = kpis;
    const totalRuns = (k.totalAiCompleted ?? 0) + (k.totalAiFailed ?? 0);
    const successRate = totalRuns > 0 ? (100 - (k.failureRate ?? 0)).toFixed(1) : '—';

    const merchantGrowthCategories = useMemo(() => merchantGrowth.map((d) => formatShortDate(d.date)), [merchantGrowth]);
    const merchantGrowthSeries = useMemo(() => [{ name: 'New signups', data: merchantGrowth.map((d) => d.count) }], [merchantGrowth]);

    const aiUsageCategories = useMemo(() => aiUsageByDay.map((d) => formatShortDate(d.date)), [aiUsageByDay]);
    const aiUsageSeries = useMemo(
        () => [
            { name: 'Completed', data: aiUsageByDay.map((d) => d.completed) },
            { name: 'Failed', data: aiUsageByDay.map((d) => d.failed) },
        ],
        [aiUsageByDay],
    );

    const planLabels = useMemo(() => planDistribution.map((p) => p.plan_name), [planDistribution]);
    const planSeries = useMemo(() => planDistribution.map((p) => p.count), [planDistribution]);

    const topMerchantsLabels = useMemo(() => topMerchantsByUsage.map((m) => (m.shop_domain || '—').replace(/\.myshopify\.com$/, '')), [topMerchantsByUsage]);
    const topMerchantsSeries = useMemo(() => [{ name: 'AI runs', data: topMerchantsByUsage.map((m) => m.runs) }], [topMerchantsByUsage]);

    const toolLabels = useMemo(() => aiRunsByTool.map((t) => TOOL_LABELS[t.tool_used] || t.tool_used), [aiRunsByTool]);
    const toolCompletedSeries = useMemo(() => aiRunsByTool.map((t) => t.completed ?? 0), [aiRunsByTool]);
    const toolFailedSeries = useMemo(() => aiRunsByTool.map((t) => t.failed ?? 0), [aiRunsByTool]);

    const areaOptions = {
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', opacity: 0.35 },
        dataLabels: { enabled: false },
        xaxis: { categories: [], labels: { style: { fontSize: '10px' }, rotate: -45 } },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        legend: { position: 'top', fontSize: '11px' },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        tooltip: { theme: 'dark' },
    };

    const barOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '70%', horizontal: false } },
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { fontSize: '10px' }, rotate: -25 } },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        legend: { position: 'top', fontSize: '11px' },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        tooltip: { theme: 'dark' },
    };

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        labels: [],
        legend: { position: 'bottom', fontSize: '11px' },
        colors: ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'],
        dataLabels: { enabled: true },
        plotOptions: { pie: { donut: { size: '65%' } } },
    };

    return (
        <AdminLayout
            title="Analytics"
            breadcrumbs={[{ label: 'Reports' }, { label: 'Analytics' }]}
        >
            <div className="space-y-6">
                {/* Period selector */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics overview</h1>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Period</span>
                        {PERIOD_OPTIONS.map((d) => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => applyPeriod(d)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    period === d ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                Last {d} days
                            </button>
                        ))}
                    </div>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-primary-50 dark:bg-primary-900/20">
                                <Store size={18} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total merchants</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{Number(k.totalMerchants ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-emerald-50 dark:bg-emerald-900/20">
                                <UserPlus size={18} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">New (period)</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{Number(k.newMerchantsInPeriod ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
                                <Activity size={18} className="text-sky-600 dark:text-sky-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Active (period)</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{Number(k.activeMerchantsInPeriod ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-900/20">
                                <Zap size={18} className="text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">AI runs (period)</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{Number(k.totalAiRuns ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-900/20">
                                <TrendingUp size={18} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Success rate</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{successRate}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg p-2 bg-rose-50 dark:bg-rose-900/20">
                                <CreditCard size={18} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Credits consumed</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{Number(k.creditsConsumedInPeriod ?? 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts row 1: Merchant growth + AI usage */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Merchant signups</h3>
                        {merchantGrowthCategories.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No data in period</div>
                        ) : (
                            <Chart
                                options={{ ...areaOptions, colors: ['#0ea5e9'], xaxis: { ...areaOptions.xaxis, categories: merchantGrowthCategories } }}
                                series={merchantGrowthSeries}
                                type="area"
                                height={240}
                            />
                        )}
                    </div>
                    <div className="card overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AI Studio usage (completed vs failed)</h3>
                        {aiUsageCategories.length === 0 ? (
                            <div className="h-56 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No data in period</div>
                        ) : (
                            <Chart
                                options={{
                                    ...areaOptions,
                                    colors: ['#10b981', '#ef4444'],
                                    xaxis: { ...areaOptions.xaxis, categories: aiUsageCategories },
                                }}
                                series={aiUsageSeries}
                                type="area"
                                height={240}
                            />
                        )}
                    </div>
                </div>

                {/* Charts row 2: Plan distribution + Top merchants + AI by tool */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="card overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Plan distribution</h3>
                        {planSeries.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No data</div>
                        ) : (
                            <Chart
                                options={{ ...donutOptions, labels: planLabels }}
                                series={planSeries}
                                type="donut"
                                height={220}
                            />
                        )}
                    </div>
                    <div className="card overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top merchants by AI runs (period)</h3>
                        {topMerchantsSeries[0].data.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No data</div>
                        ) : (
                            <Chart
                                options={{
                                    ...barOptions,
                                    plotOptions: { bar: { ...barOptions.plotOptions.bar, horizontal: true } },
                                    xaxis: { categories: topMerchantsLabels },
                                }}
                                series={topMerchantsSeries}
                                type="bar"
                                height={220}
                            />
                        )}
                    </div>
                    <div className="card overflow-hidden p-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">AI runs by tool (period)</h3>
                        {toolLabels.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">No data</div>
                        ) : (
                            <Chart
                                options={{
                                    ...barOptions,
                                    colors: ['#10b981', '#ef4444'],
                                    xaxis: { categories: toolLabels },
                                }}
                                series={[
                                    { name: 'Completed', data: toolCompletedSeries },
                                    { name: 'Failed', data: toolFailedSeries },
                                ]}
                                type="bar"
                                height={220}
                            />
                        )}
                    </div>
                </div>

                {/* Tables: Top merchants + Recent failures */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Top merchants by AI usage</h2>
                            <Link href="/admin/merchants" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                View merchants <ExternalLink size={12} />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            {topMerchantsByUsage.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No usage in selected period</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700">
                                            <th className="text-left py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">Store</th>
                                            <th className="text-right py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">Runs</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topMerchantsByUsage.map((m, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-4 text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{m.shop_domain || '—'}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{m.runs.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                    <div className="card overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-500" />
                                Recent failures
                </h2>
                            <Link href="/admin/ai-studio-tools" className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                AI Studio report <ExternalLink size={12} />
                            </Link>
                        </div>
                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                            {recentFailures.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No recent failures</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white dark:bg-gray-900">
                                        <tr className="border-b border-gray-100 dark:border-gray-700">
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Store</th>
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Error</th>
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentFailures.map((f) => (
                                            <tr key={f.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-4 text-gray-900 dark:text-white truncate max-w-[120px]">{f.shop_domain || '—'}</td>
                                                <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{TOOL_LABELS[f.tool_used] || f.tool_used}</td>
                                                <td className="py-2 px-4 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[180px]" title={f.error_message}>{f.error_message}</td>
                                                <td className="py-2 px-4 text-gray-500 dark:text-gray-500 text-xs whitespace-nowrap">{formatDate(f.created_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                {/* Extra KPIs summary */}
                <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Summary (selected period)</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Completed runs</p>
                            <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Number(k.totalAiCompleted ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Failed runs</p>
                            <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{Number(k.totalAiFailed ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">On paid plan</p>
                            <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Number(k.merchantsWithPlan ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400">Total credits issued (all merchants)</p>
                            <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{Number(k.totalCreditsIssued ?? 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
