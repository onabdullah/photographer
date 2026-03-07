import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { useState, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Sparkles, Cpu, Activity, Package, BarChart3 } from 'lucide-react';

const TOOL_COLORS = [
    '#0ea5e9',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#6366f1',
];

const CHART_HEIGHT = 200;

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

export default function AIStudioToolsIndex({ tools = [], chartData = [], recentGenerations = [], totalApiRequests = 0 }) {
    const [selectedTool, setSelectedTool] = useState('all');
    const [mainTab, setMainTab] = useState('overview'); // 'overview' | 'models'

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
        <AdminLayout
            title="AI Studio Tools"
            breadcrumbs={[{ label: 'Reports' }, { label: 'AI Studio Tools' }]}
        >
            <div className="space-y-4">
                {/* Main tabs: Overview | Models */}
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
                        Models
                    </button>
                </div>

                {mainTab === 'models' && (
                    <div className="card overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <Cpu size={16} className="text-gray-500 dark:text-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Model information
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="text-left py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                        <th className="text-left py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">Model</th>
                                        <th className="text-left py-2.5 px-4 font-medium text-gray-700 dark:text-gray-300">Provider</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tools.map((t) => (
                                        <tr key={t.key} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-2.5 px-4 text-gray-900 dark:text-white">{t.label}</td>
                                            <td className="py-2.5 px-4 text-gray-700 dark:text-gray-300">{t.model_name}</td>
                                            <td className="py-2.5 px-4 text-gray-600 dark:text-gray-400">{t.model_provider}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        </div>

                        {/* Charts row - compact, side by side on larger screens */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Usage over time */}
                            <div className="card overflow-hidden p-3">
                                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Usage over time (30d)
                                </h3>
                                {usageByDate.length === 0 ? (
                                    <div className="h-[180px] flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
                                        No data. Run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ai-studio:aggregate-daily --backfill</code>
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

                        {/* Usage summary table - compact */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Usage summary</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-gray-700">
                                            <th className="text-left py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Runs</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Success</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">Failed</th>
                                            <th className="text-right py-2 px-4 font-medium text-gray-700 dark:text-gray-300">In production</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredTools.map((t) => (
                                            <tr key={t.key} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <td className="py-2 px-4 text-gray-900 dark:text-white">{t.label}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.total_completed?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-green-600 dark:text-green-400">{t.success_count?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-red-600 dark:text-red-400">{t.failed_count?.toLocaleString() ?? 0}</td>
                                                <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.used_in_production?.toLocaleString() ?? 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent activity - compact */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent activity</h2>
                            </div>
                            <div className="overflow-x-auto">
                                {filteredRecent.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-xs text-gray-500 dark:text-gray-400">No recent generations</div>
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
                                            {filteredRecent.map((gen) => (
                                                <tr key={gen.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">{gen.shop_domain || '—'}</td>
                                                    <td className="py-2 px-4 text-gray-700 dark:text-gray-300">{toolLabel(gen.tool_used)}</td>
                                                    <td className="py-2 px-4 text-gray-600 dark:text-gray-400">{formatDate(gen.updated_at)}</td>
                                                    <td className="py-2 px-4">
                                                        {gen.result_image_url ? (
                                                            <a href={gen.result_image_url} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 rounded border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                                <img src={gen.result_image_url} alt="" className="w-full h-full object-cover" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        {gen.has_product ? (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                                                On product
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
