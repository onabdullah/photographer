import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { useState, useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    Cell,
} from 'recharts';
import { Sparkles, Cpu, Activity, Package } from 'lucide-react';

const TOOL_COLORS = [
    '#0ea5e9',
    '#8b5cf6',
    '#10b981',
    '#f59e0b',
    '#ec4899',
    '#6366f1',
];

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

    return (
        <AdminLayout
            title="AI Studio Tools"
            breadcrumbs={[{ label: 'Reports' }, { label: 'AI Studio Tools' }]}
        >
            <div className="space-y-6">
                {/* Tool filter tabs */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                    {toolOptions.map((opt) => (
                        <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedTool(opt.key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedTool === opt.key
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card flex items-center gap-4">
                        <div className="rounded-lg p-2.5 bg-primary-50 dark:bg-primary-900/20">
                            <Activity size={20} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total API requests</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                                {totalApiRequests.toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="rounded-lg p-2.5 bg-green-50 dark:bg-green-900/20">
                            <Sparkles size={20} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total completed</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                                {filteredTools.reduce((s, t) => s + (t.total_completed || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <div className="rounded-lg p-2.5 bg-amber-50 dark:bg-amber-900/20">
                            <Package size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Used in production</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">
                                {filteredTools.reduce((s, t) => s + (t.used_in_production || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Usage over time */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Usage over time (last 30 days)
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Completed and failed runs by day
                            {selectedTool !== 'all' && ` — ${toolLabel(selectedTool)}`}
                        </p>
                    </div>
                    <div className="p-6">
                        {usageByDate.length === 0 ? (
                            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm">
                                No snapshot data yet. Run <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">php artisan ai-studio:aggregate-daily --backfill</code> to populate.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={320}>
                                <AreaChart data={usageByDate} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <XAxis dataKey="date" tickFormatter={formatShortDate} className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        labelFormatter={(v) => formatShortDate(v)}
                                        formatter={(value) => [Number(value).toLocaleString(), '']}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="completed" name="Completed" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                    <Area type="monotone" dataKey="failed" name="Failed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Success vs Failed by tool */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Success vs failed by tool
                        </h2>
                    </div>
                    <div className="p-6">
                        {filteredTools.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No tools to display.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={filteredTools}
                                    layout="vertical"
                                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <XAxis type="number" className="text-xs" />
                                    <YAxis type="category" dataKey="label" width={110} className="text-xs" />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="success_count" name="Success" fill="#10b981" radius={[0, 4, 4, 0]} />
                                    <Bar dataKey="failed_count" name="Failed" fill="#ef4444" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Used in production by tool */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Used in production (assigned to product)
                        </h2>
                    </div>
                    <div className="p-6">
                        {filteredTools.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No tools to display.</p>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart
                                    data={filteredTools}
                                    margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                                    <XAxis dataKey="label" className="text-xs" angle={-25} textAnchor="end" interval={0} />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Bar dataKey="used_in_production" name="Assigned to product" radius={[4, 4, 0, 0]}>
                                        {filteredTools.map((_, i) => (
                                            <Cell key={i} fill={TOOL_COLORS[i % TOOL_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Model information table */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <Cpu size={18} className="text-gray-500 dark:text-gray-400" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Model information
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Model</th>
                                    <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Provider</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTools.map((t) => (
                                    <tr key={t.key} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-3 px-6 text-gray-900 dark:text-white">{t.label}</td>
                                        <td className="py-3 px-6 text-gray-700 dark:text-gray-300">{t.model_name}</td>
                                        <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{t.model_provider}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Usage summary table */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Usage summary
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                    <th className="text-right py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Total runs</th>
                                    <th className="text-right py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Success</th>
                                    <th className="text-right py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Failed</th>
                                    <th className="text-right py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Used in production</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTools.map((t) => (
                                    <tr key={t.key} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-3 px-6 text-gray-900 dark:text-white">{t.label}</td>
                                        <td className="py-3 px-6 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.total_completed?.toLocaleString() ?? 0}</td>
                                        <td className="py-3 px-6 text-right tabular-nums text-green-600 dark:text-green-400">{t.success_count?.toLocaleString() ?? 0}</td>
                                        <td className="py-3 px-6 text-right tabular-nums text-red-600 dark:text-red-400">{t.failed_count?.toLocaleString() ?? 0}</td>
                                        <td className="py-3 px-6 text-right tabular-nums text-gray-700 dark:text-gray-300">{t.used_in_production?.toLocaleString() ?? 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent activity */}
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            Recent activity
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Latest generations
                            {selectedTool !== 'all' && ` — ${toolLabel(selectedTool)}`}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        {filteredRecent.length === 0 ? (
                            <div className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                No recent generations
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Shop</th>
                                        <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Tool</th>
                                        <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Date</th>
                                        <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Preview</th>
                                        <th className="text-left py-3 px-6 font-medium text-gray-700 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecent.map((gen) => (
                                        <tr key={gen.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="py-3 px-6 text-gray-900 dark:text-white font-medium">{gen.shop_domain || '—'}</td>
                                            <td className="py-3 px-6 text-gray-700 dark:text-gray-300">{toolLabel(gen.tool_used)}</td>
                                            <td className="py-3 px-6 text-gray-600 dark:text-gray-400">{formatDate(gen.updated_at)}</td>
                                            <td className="py-3 px-6">
                                                {gen.result_image_url ? (
                                                    <a href={gen.result_image_url} target="_blank" rel="noopener noreferrer" className="block w-12 h-12 rounded border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                        <img src={gen.result_image_url} alt="" className="w-full h-full object-cover" />
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-6">
                                                {gen.has_product ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
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
            </div>
        </AdminLayout>
    );
}
