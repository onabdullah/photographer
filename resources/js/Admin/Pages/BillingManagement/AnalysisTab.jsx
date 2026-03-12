import { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { 
    TrendingUp, Users, DollarSign, CreditCard, 
    Package, Star, Activity, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';

export default function AnalysisTab({ plans, creditPacks, analytics }) {
    const {
        planStats = [],
        revenueData = [],
        creditPackUsage = [],
        timeline = [],
        totals = {},
    } = analytics || {};

    // Stats cards configuration
    const statsCards = [
        {
            label: 'Total Revenue',
            value: `$${(totals.totalRevenue || 0).toLocaleString()}`,
            change: totals.revenueChange || 0,
            icon: DollarSign,
            color: 'indigo',
        },
        {
            label: 'Active Subscriptions',
            value: (totals.activeSubscriptions || 0).toLocaleString(),
            change: totals.subsChange || 0,
            icon: Users,
            color: 'green',
        },
        {
            label: 'Credit Packs Sold',
            value: (totals.creditPacksSold || 0).toLocaleString(),
            change: totals.packsChange || 0,
            icon: Package,
            color: 'purple',
        },
        {
            label: 'Avg Revenue/User',
            value: `$${(totals.avgRevenuePerUser || 0).toFixed(2)}`,
            change: totals.arpuChange || 0,
            icon: TrendingUp,
            color: 'amber',
        },
    ];

    // Plan distribution pie chart
    const planDistributionOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
        labels: planStats.map(p => p.name),
        colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
        legend: { position: 'bottom' },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total Merchants',
                            formatter: () => planStats.reduce((sum, p) => sum + (p.count || 0), 0),
                        },
                    },
                },
            },
        },
        dataLabels: { enabled: false },
    };

    const planDistributionSeries = planStats.map(p => p.count || 0);

    // Revenue timeline chart
    const revenueTimelineOptions = {
        chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#6366f1', '#8b5cf6'],
        stroke: { curve: 'smooth', width: 2 },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 } },
        xaxis: { 
            categories: timeline.map(t => t.date),
            labels: { style: { colors: '#9ca3af' } },
        },
        yaxis: { labels: { style: { colors: '#9ca3af' } } },
        grid: { borderColor: '#374151', strokeDashArray: 4 },
        legend: { position: 'top', horizontalAlign: 'right' },
        dataLabels: { enabled: false },
    };

    const revenueTimelineSeries = [
        {
            name: 'Subscriptions',
            data: timeline.map(t => t.subscriptions || 0),
        },
        {
            name: 'Credit Packs',
            data: timeline.map(t => t.creditPacks || 0),
        },
    ];

    // Plan popularity bar chart
    const popularityOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#10b981'],
        plotOptions: {
            bar: { horizontal: true, borderRadius: 6, dataLabels: { position: 'top' } },
        },
        xaxis: { 
            categories: planStats.map(p => p.name),
            labels: { style: { colors: '#9ca3af' } },
        },
        yaxis: { labels: { style: { colors: '#9ca3af' } } },
        grid: { borderColor: '#374151' },
        dataLabels: { enabled: false },
    };

    const popularitySeries = [{
        name: 'Merchants',
        data: planStats.map(p => p.count || 0),
    }];

    // Credit pack sales bar chart
    const creditPackOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        colors: ['#8b5cf6'],
        plotOptions: {
            bar: { borderRadius: 6, columnWidth: '60%' },
        },
        xaxis: { 
            categories: creditPackUsage.map(p => `${p.credits} Credits`),
            labels: { style: { colors: '#9ca3af' } },
        },
        yaxis: { labels: { style: { colors: '#9ca3af' } } },
        grid: { borderColor: '#374151', strokeDashArray: 4 },
        dataLabels: { enabled: false },
    };

    const creditPackSeries = [{
        name: 'Units Sold',
        data: creditPackUsage.map(p => p.sold || 0),
    }];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    const isPositive = stat.change >= 0;
                    const colorClasses = {
                        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                        amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                    };

                    return (
                        <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                                    <Icon size={20} />
                                </div>
                                {stat.change !== 0 && (
                                    <span className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(stat.change)}%
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Distribution */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Distribution</h3>
                    {planStats.length > 0 ? (
                        <Chart
                            options={planDistributionOptions}
                            series={planDistributionSeries}
                            type="donut"
                            height={280}
                        />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400">
                            No data available
                        </div>
                    )}
                </div>

                {/* Plan Popularity */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Plan Popularity</h3>
                    {planStats.length > 0 ? (
                        <Chart
                            options={popularityOptions}
                            series={popularitySeries}
                            type="bar"
                            height={280}
                        />
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-gray-400">
                            No data available
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue Timeline */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Timeline (Last 30 Days)</h3>
                {timeline.length > 0 ? (
                    <Chart
                        options={revenueTimelineOptions}
                        series={revenueTimelineSeries}
                        type="area"
                        height={300}
                    />
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                        No data available
                    </div>
                )}
            </div>

            {/* Credit Pack Sales */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Pack Sales</h3>
                {creditPackUsage.length > 0 ? (
                    <Chart
                        options={creditPackOptions}
                        series={creditPackSeries}
                        type="bar"
                        height={280}
                    />
                ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                        No data available
                    </div>
                )}
            </div>

            {/* Top Plans Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performing Plans</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Plan Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Active Merchants
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Monthly Revenue
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Avg. Lifetime
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {planStats.map((plan, index) => (
                                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {plan.name}
                                            </div>
                                            {index === 0 && (
                                                <Star size={14} className="text-yellow-500" fill="currentColor" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {plan.count || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        ${(plan.revenue || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                        {plan.avgLifetime || 0} days
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
