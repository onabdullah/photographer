import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { useState, useMemo, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { router } from '@inertiajs/react';
import { Sparkles, Cpu, Activity, Package, BarChart3, Coins, Trophy, Clock, AlertCircle, Download, ShoppingBag, Settings } from 'lucide-react';

const TOOL_COLORS = [
    '#0ea5e9',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#6366f1',
];

const CHART_HEIGHT = 200;

// Blinking animation style
const blinkingAnimation = `
  @keyframes blink {
    0%, 49%, 100% { opacity: 1; }
    50%, 99% { opacity: 0.3; }
  }
  .status-dot-live {
    animation: blink 2s infinite;
  }
`;

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AIStudioToolsIndex({
    tools = [],
    chartData = [],
    recentGenerations = [],
    totalApiRequests = 0,
    mostUsedToolKey = null,
    mostUsedToolLabel = null,
    initialTab = 'overview',
}) {
    const [selectedTool, setSelectedTool] = useState('all');
    const [mainTab, setMainTab] = useState(initialTab === 'models' ? 'models' : 'overview');

    useEffect(() => {
        setMainTab(initialTab === 'models' ? 'models' : 'overview');
    }, [initialTab]);

    const loadModelSettings = async (modelKey) => {
        try {
            setLoadingSettings(true);
            const response = await axios.get('/admin/nano-banana-settings');
            setModelSettings(response.data.settings);
            setModelSettingsModal({
                isOpen: true,
                model: { key: modelKey, name: 'Nano Banana 2' }
            });
        } catch (err) {
            alert('Failed to load model settings');
        } finally {
            setLoadingSettings(false);
        }
    };

    const toolOptions = useMemo(() => {
        const opts = [{ key: 'all', label: 'All tools' }];
        tools.forEach((t) => opts.push({ key: t.key, label: t.label }));
        return opts;
    }, [tools]);

    const usageByDate = useMemo(() => {
        const byDate = {};
        chartData.forEach((row) => {
            if (selectedTool !== 'all' && row.tool_used !== selectedTool) return;
            const d = row.date;
            if (!byDate[d]) {
                byDate[d] = { date: d, completed: 0, failed: 0, usedInProduction: 0 };
            }
            byDate[d].completed += row.total_completed || 0;
            byDate[d].failed += row.total_failed || 0;
            byDate[d].usedInProduction += row.used_in_production || 0;
        });
        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [chartData, selectedTool]);

    const filteredTools = useMemo(() => {
        if (selectedTool === 'all') return tools;
        return tools.filter((t) => t.key === selectedTool);
    }, [tools, selectedTool]);

    const filteredRecent = useMemo(() => {
        if (selectedTool === 'all') return recentGenerations;
        return recentGenerations.filter((g) => g.tool_used === selectedTool);
    }, [recentGenerations, selectedTool]);

    const [activitySearch, setActivitySearch] = useState('');
    const [activityStatusFilter, setActivityStatusFilter] = useState('all'); // 'all' | 'on_product' | 'downloaded' | 'ready'
    const [activityPage, setActivityPage] = useState(1);
    const ACTIVITY_PAGE_SIZE = 15;

    const getActivityStatusLabel = (gen) => {
        const onProduct = !!gen.has_product;
        const downloaded = !!gen.has_downloaded;
        if (onProduct && downloaded) return 'On product · Downloaded';
        if (onProduct) return 'On product';
        if (downloaded) return 'Downloaded';
        return 'Ready';
    };

    const filteredRecentForTable = useMemo(() => {
        let list = filteredRecent;
        const search = (activitySearch || '').trim().toLowerCase();
        if (search) {
            list = list.filter((g) => (g.shop_domain || '').toLowerCase().includes(search));
        }
        if (activityStatusFilter !== 'all') {
            if (activityStatusFilter === 'on_product') list = list.filter((g) => g.has_product);
            else if (activityStatusFilter === 'downloaded') list = list.filter((g) => g.has_downloaded);
            else if (activityStatusFilter === 'ready') list = list.filter((g) => !g.has_product && !g.has_downloaded);
        }
        return list;
    }, [filteredRecent, activitySearch, activityStatusFilter]);

    const activityTotal = filteredRecentForTable.length;
    const activityLastPage = Math.max(1, Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE));
    const activityPaginated = useMemo(() => {
        const start = (activityPage - 1) * ACTIVITY_PAGE_SIZE;
        return filteredRecentForTable.slice(start, start + ACTIVITY_PAGE_SIZE);
    }, [filteredRecentForTable, activityPage, ACTIVITY_PAGE_SIZE]);

    useEffect(() => {
        setActivityPage(1);
    }, [activitySearch, activityStatusFilter, selectedTool]);

    const toolLabel = (key) => tools.find((t) => t.key === key)?.label || key;

    // ApexCharts: usage over time (area)
    const usageChartOptions = useMemo(() => ({
        chart: { type: 'area', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', opacity: 0.4 },
        colors: ['#10b981', '#ef4444'],
        dataLabels: { enabled: false },
        xaxis: {
            categories: usageByDate.map((d) => formatShortDate(d.date)),
            labels: { style: { fontSize: '10px' } },
        },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        legend: { position: 'top', fontSize: '11px' },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        tooltip: { theme: 'dark' },
    }), [usageByDate]);
    const usageChartSeries = useMemo(() => [
        { name: 'Completed', data: usageByDate.map((d) => d.completed) },
        { name: 'Failed', data: usageByDate.map((d) => d.failed) },
    ], [usageByDate]);

    // ApexCharts: success vs failed by tool (horizontal bar)
    const successFailedOptions = useMemo(() => ({
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
        colors: ['#10b981', '#ef4444'],
        dataLabels: { enabled: false },
        xaxis: { labels: { style: { fontSize: '10px' } } },
        yaxis: { labels: { style: { fontSize: '10px' }, maxWidth: 100 } },
        legend: { position: 'top', fontSize: '11px' },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        tooltip: { theme: 'dark' },
    }), []);
    const successFailedSeries = useMemo(() => [
        { name: 'Success', data: filteredTools.map((t) => t.success_count ?? 0) },
        { name: 'Failed', data: filteredTools.map((t) => t.failed_count ?? 0) },
    ], [filteredTools]);
    const successFailedCategories = useMemo(() => filteredTools.map((t) => t.label), [filteredTools]);

    // ApexCharts: used in production by tool (bar)
    const productionOptions = useMemo(() => ({
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        colors: TOOL_COLORS,
        dataLabels: { enabled: false },
        xaxis: { categories: filteredTools.map((t) => t.label), labels: { style: { fontSize: '10px' }, rotate: -25 } },
        yaxis: { labels: { style: { fontSize: '10px' } } },
        grid: { borderColor: 'rgba(255,255,255,0.06)', strokeDashArray: 3 },
        tooltip: { theme: 'dark' },
    }), [filteredTools]);
    const productionSeries = useMemo(() => [
        { name: 'Used in production', data: filteredTools.map((t) => t.used_in_production ?? 0) },
    ], [filteredTools]);

    return (
        <>
            <style>{blinkingAnimation}</style>
            <AdminLayout
            title="AI Tools Analysis"
            breadcrumbs={[{ label: 'Reports' }, { label: 'AI Tools Analysis' }]}
        >
            <div className="space-y-4">
                {/* Main tabs: Overview | Tools */}
                <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <button
                        type="button"
                        onClick={() => setMainTab('overview')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            mainTab === 'overview'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <BarChart3 size={16} />
                        Overview
                    </button>
                    <button
                        type="button"
                        onClick={() => setMainTab('models')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            mainTab === 'models'
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        <Cpu size={16} />
                        Tools
                    </button>
                </div>

                {mainTab === 'models' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Cpu size={18} className="text-gray-500 dark:text-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Tools information & quick stats
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tools.map((t, index) => (
                                <div
                                    key={t.key}
                                    className="card overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                >
                                    <div
                                        className="h-1 flex-shrink-0"
                                        style={{ backgroundColor: TOOL_COLORS[index % TOOL_COLORS.length], opacity: 0.35 }}
                                    />
                                    <div className="p-4 flex-1 flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex items-start gap-2">
                                                <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${t.is_enabled ? 'status-dot-live bg-emerald-500' : 'bg-amber-500/40'}`} title={t.is_enabled ? 'Live' : 'Hidden'} />
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {t.label}
                                                    </h3>
                                                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 line-clamp-2" title={t.model_name}>
                                                        {t.model_name}
                                                    </p>
                                                    <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                                                        {t.model_provider}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium">Credit used</p>
                                                <p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{(t.credits_used ?? 0).toLocaleString()}</p>
                                                <div className="my-1 border-t border-gray-200 dark:border-gray-600" />
                                                <p className="text-[10px] text-gray-600 dark:text-gray-400 tabular-nums">
                                                    {t.estimated_rate_per_image_usd != null && t.estimated_rate_per_image_usd > 0
                                                        ? `~$${Number(t.estimated_rate_per_image_usd).toFixed(4)}/img`
                                                        : '$0/img'}
                                                </p>
                                                <p className="text-[10px] text-gray-600 dark:text-gray-400 tabular-nums">
                                                    Consumed: {t.consumed_usd != null && t.consumed_usd > 0 ? `$${Number(t.consumed_usd).toFixed(2)}` : '$0'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700/80 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Runs</p>
                                                <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{(t.requests_count ?? t.total_completed ?? 0).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Success</p>
                                                <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">{t.success_count?.toLocaleString() ?? 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Failed</p>
                                                <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{t.failed_count?.toLocaleString() ?? 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Downloaded</p>
                                                <p className="font-semibold text-teal-600 dark:text-teal-400 tabular-nums">{t.downloaded_count?.toLocaleString() ?? 0}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">In production</p>
                                                <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{t.used_in_production?.toLocaleString() ?? 0}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 pt-2">
                                            <div className="flex items-center justify-end gap-2">
                                                <select
                                                    value={t.is_enabled ? 'enabled' : 'disabled'}
                                                    onChange={(e) => {
                                                        const isEnabled = e.target.value === 'enabled';
                                                        router.patch('/admin/ai-studio-tools/settings', { tool_key: t.key, is_enabled: isEnabled }, { preserveScroll: true });
                                                    }}
                                                    className={`min-h-[28px] px-2.5 py-1 text-xs font-medium rounded-md border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors appearance-none bg-no-repeat pr-7 ${
                                                        t.is_enabled
                                                            ? 'bg-gray-500/10 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-400/25 dark:border-gray-500/30'
                                                            : 'bg-amber-500/10 dark:bg-amber-500/10 text-amber-600/70 dark:text-amber-400/60 border-amber-400/30 dark:border-amber-500/25'
                                                    }`}
                                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center' }}
                                                    aria-label={`${t.label} visibility on store`}
                                                >
                                                    <option value="enabled">Show on store</option>
                                                    <option value="disabled">Hidden</option>
                                                </select>
                                                <button
                                                    className="min-h-[28px] px-3 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                                                    title="Settings"
                                                >
                                                    <Settings size={14} />
                                                    Settings
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {mainTab === 'overview' && (
                    <>
                        {/* Tool filter tabs */}
                        <div className="flex flex-wrap gap-2">
                            {toolOptions.map((opt) => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => setSelectedTool(opt.key)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        selectedTool === opt.key
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Summary cards - compact */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-primary-50 dark:bg-primary-900/20">
                                    <Activity size={18} className="text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total API requests</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                        {totalApiRequests.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-900/20">
                                    <Coins size={18} className="text-sky-600 dark:text-sky-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Credits used (filtered)</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                        {filteredTools.reduce((s, t) => s + (t.credits_used ?? 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-green-50 dark:bg-green-900/20">
                                    <Sparkles size={18} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total completed</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                        {filteredTools.reduce((s, t) => s + (t.total_completed || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-900/20">
                                    <Package size={18} className="text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Used in production</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                        {filteredTools.reduce((s, t) => s + (t.used_in_production || 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-teal-50 dark:bg-teal-900/20">
                                    <Download size={18} className="text-teal-600 dark:text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Downloaded</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                                        {filteredTools.reduce((s, t) => s + (t.downloaded_count ?? 0), 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="card flex items-center gap-3 p-3">
                                <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-900/20">
                                    <Trophy size={18} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Most used tool</p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate" title={mostUsedToolLabel || '—'}>
                                        {mostUsedToolLabel || '—'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Charts row - compact, side by side on larger screens */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Usage over time */}
                            <div className="card overflow-hidden p-3">
                                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Usage over time (30d)
                                </h3>
                                {usageByDate.length === 0 ? (
                                    <div className="h-[180px] flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-xs text-center gap-2 px-2">
                                        <span>No snapshot data yet.</span>
                                        <span>Run once to backfill from existing generations:</span>
                                        <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[11px]">ai-studio:aggregate-daily --backfill</code>
                                        <span className="text-[10px] opacity-80">Then this chart updates daily via scheduler.</span>
                                    </div>
                                ) : (
                                    <Chart
                                        options={usageChartOptions}
                                        series={usageChartSeries}
                                        type="area"
                                        height={CHART_HEIGHT}
                                    />
                                )}
                            </div>
                            {/* Success vs Failed */}
                            <div className="card overflow-hidden p-3">
                                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Success vs failed
                                </h3>
                                {filteredTools.length === 0 ? (
                                    <div className="h-[180px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">No tools</div>
                                ) : (
                                    <Chart
                                        options={{ ...successFailedOptions, xaxis: { ...successFailedOptions.xaxis, categories: successFailedCategories } }}
                                        series={successFailedSeries}
                                        type="bar"
                                        height={CHART_HEIGHT}
                                    />
                                )}
                            </div>
                            {/* Used in production */}
                            <div className="card overflow-hidden p-3">
                                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Used in production
                                </h3>
                                {filteredTools.length === 0 ? (
                                    <div className="h-[180px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">No tools</div>
                                ) : (
                                    <Chart
                                        options={productionOptions}
                                        series={productionSeries}
                                        type="bar"
                                        height={CHART_HEIGHT}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Used in products by type */}
                        <div className="card overflow-hidden p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag size={16} className="text-amber-500 dark:text-amber-400" />
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Generations used in products (by tool type)</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                {filteredTools.map((t) => (
                                    <div key={t.key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-800/30">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate" title={t.label}>{t.label}</p>
                                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">{t.used_in_production?.toLocaleString() ?? 0}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">assigned to product</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Usage summary table - compact (with credits, response time) */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Usage summary</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700">
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Credits</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Runs</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Success</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Failed</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Downloaded</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">In production</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Avg response</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTools.map((t) => (
                                            <tr key={t.key} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-4 text-gray-900 dark:text-white">{t.label}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.credits_used?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.total_completed?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-green-600 dark:text-green-400">{t.success_count?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-red-600 dark:text-red-400">{t.failed_count?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-teal-600 dark:text-teal-400">{t.downloaded_count?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.used_in_production?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                                    {t.avg_response_seconds != null ? `${t.avg_response_seconds}s` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Per-tool: Response time & Errors (when one tool selected, show full details) */}
                        {selectedTool !== 'all' && filteredTools.length === 1 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="card overflow-hidden p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock size={14} className="text-gray-500 dark:text-gray-400" />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Response time — {filteredTools[0].label}</h3>
                                    </div>
                                    {filteredTools[0].response_time_count > 0 ? (
                                        <dl className="grid grid-cols-3 gap-2 text-sm">
                                            <div>
                                                <dt className="text-xs text-gray-500 dark:text-gray-400">Avg</dt>
                                                <dd className="font-mono font-medium text-gray-900 dark:text-white">{filteredTools[0].avg_response_seconds}s</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-gray-500 dark:text-gray-400">Min</dt>
                                                <dd className="font-mono font-medium text-gray-900 dark:text-white">{filteredTools[0].min_response_seconds}s</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs text-gray-500 dark:text-gray-400">Max</dt>
                                                <dd className="font-mono font-medium text-gray-900 dark:text-white">{filteredTools[0].max_response_seconds}s</dd>
                                            </div>
                                            <div className="col-span-3">
                                                <dt className="text-xs text-gray-500 dark:text-gray-400">Samples</dt>
                                                <dd className="font-mono text-gray-700 dark:text-gray-300">{filteredTools[0].response_time_count} completed/failed with timing</dd>
                                            </div>
                                        </dl>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">No response time data yet (new completions will be recorded).</p>
                                    )}
                                </div>
                                <div className="card overflow-hidden p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Errors — {filteredTools[0].label}</h3>
                                    </div>
                                    {(filteredTools[0].errors?.length ?? 0) > 0 ? (
                                        <div className="overflow-x-auto max-h-40 overflow-y-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-gray-200 dark:border-gray-600">
                                                        <th className="text-left py-1.5 font-medium text-gray-700 dark:text-gray-300">Error</th>
                                                        <th className="text-right py-1.5 font-medium text-gray-700 dark:text-gray-300">Count</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredTools[0].errors.map((err, i) => (
                                                        <tr key={i} className="border-b border-gray-100 dark:border-gray-700/50">
                                                            <td className="py-1.5 text-gray-700 dark:text-gray-300 truncate max-w-[200px]" title={err.message}>{err.message}</td>
                                                            <td className="py-1.5 text-right tabular-nums text-red-600 dark:text-red-400">{err.count}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">No errors recorded for this tool.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* When "All tools": show errors summary (tool + top errors) */}
                        {selectedTool === 'all' && tools.some((t) => (t.errors?.length ?? 0) > 0) && (
                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-500 dark:text-red-400" />
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Errors by tool</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Error</th>
                                                <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tools.flatMap((t) => (t.errors ?? []).map((err, i) => (
                                                <tr key={`${t.key}-${i}`} className="border-b border-gray-100 dark:border-gray-700/50">
                                                    <td className="py-2 px-4 text-gray-900 dark:text-white">{t.label}</td>
                                                    <td className="py-2 px-4 text-gray-700 dark:text-gray-300 truncate max-w-md" title={err.message}>{err.message}</td>
                                                    <td className="py-2 px-4 text-right tabular-nums text-red-600 dark:text-red-400">{err.count}</td>
                                                </tr>
                                            )))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Recent activity - compact, with search and filters */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent activity</h2>
                                <div className="flex flex-wrap items-center gap-2 ml-auto">
                                    <input
                                        type="search"
                                        placeholder="Search by shop…"
                                        value={activitySearch}
                                        onChange={(e) => setActivitySearch(e.target.value)}
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2.5 py-1.5 min-w-[140px] focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        aria-label="Search by shop"
                                    />
                                    <select
                                        value={activityStatusFilter}
                                        onChange={(e) => setActivityStatusFilter(e.target.value)}
                                        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs px-2.5 py-1.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                        aria-label="Filter by status"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="on_product">On product</option>
                                        <option value="downloaded">Downloaded</option>
                                        <option value="ready">Ready</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                {filteredRecentForTable.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                                        {filteredRecent.length === 0 ? 'No recent generations' : 'No matches for search or filter'}
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 dark:border-gray-700">
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Shop</th>
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Date</th>
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Preview</th>
                                                <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activityPaginated.map((gen) => {
                                                const statusLabel = getActivityStatusLabel(gen);
                                                const isOnProduct = !!gen.has_product;
                                                const isDownloaded = !!gen.has_downloaded;
                                                const statusCls = isOnProduct
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                    : isDownloaded
                                                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300'
                                                        : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300';
                                                return (
                                                    <tr key={gen.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                        <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">{gen.shop_domain || '—'}</td>
                                                        <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{toolLabel(gen.tool_used)}</td>
                                                        <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{formatDate(gen.updated_at)}</td>
                                                        <td className="py-2 px-4">
                                                            {gen.result_image_url ? (
                                                                <a href={gen.result_image_url} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                                    <img src={gen.result_image_url} alt="Generated image thumbnail" className="w-full h-full object-cover" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-gray-400">—</span>
                                                            )}
                                                        </td>
                                                        <td className="py-2 px-4">
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusCls}`}>
                                                                {statusLabel}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {activityTotal > ACTIVITY_PAGE_SIZE && (
                                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-2">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        Showing{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {(activityPage - 1) * ACTIVITY_PAGE_SIZE + 1}
                                        </span>
                                        {' – '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {Math.min(activityPage * ACTIVITY_PAGE_SIZE, activityTotal)}
                                        </span>
                                        {' of '}
                                        <span className="font-medium text-gray-900 dark:text-white">{activityTotal}</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                            disabled={activityPage <= 1}
                                            className="btn btn-secondary text-xs py-1 px-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Previous
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActivityPage((p) => Math.min(activityLastPage, p + 1))}
                                            disabled={activityPage >= activityLastPage}
                                            className="btn btn-secondary text-xs py-1 px-2 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
        </>
    );
}
