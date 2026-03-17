import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Users, Image as ImageIcon, CreditCard, Store, UserPlus, Zap, BarChart3 } from 'lucide-react';

const STAT_CONFIG = {
    merchants: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'text-primary-600 dark:text-primary-400',
    },
    images: {
        bg: 'bg-primary-50 dark:bg-primary-900/20',
        icon: 'text-primary-600 dark:text-primary-400',
    },
    credits: {
        bg: 'bg-secondary-50 dark:bg-secondary-900/20',
        icon: 'text-secondary-600 dark:text-secondary-400',
    },
    plans: {
        bg: 'bg-gray-100 dark:bg-gray-700/50',
        icon: 'text-gray-600 dark:text-gray-400',
    },
    newMerchants: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
    },
    aiStudio: {
        bg: 'bg-violet-50 dark:bg-violet-900/20',
        icon: 'text-violet-600 dark:text-violet-400',
    },
};

export default function Dashboard({ data }) {
    const d = data || {};
    const totalMerchants        = Number(d.totalMerchants)        || 0;
    const imagesGenerated       = Number(d.imagesGenerated)      || 0;
    const totalCreditsIssued    = Number(d.totalCreditsIssued)    || 0;
    const merchantsWithPlan     = Number(d.merchantsWithPlan)     || 0;
    const newMerchantsLast7Days = Number(d.newMerchantsLast7Days) || 0;
    const aiStudioRunsTotal     = Number(d.aiStudioRunsTotal)     || 0;
    const recentMerchants       = d.recentMerchants ?? [];
    const recentImages          = d.recentImages    ?? [];

    const stats = [
        { name: 'Total Merchants',        value: totalMerchants.toLocaleString(),       key: 'merchants',    icon: Users      },
        { name: 'New (last 7 days)',      value: newMerchantsLast7Days.toLocaleString(), key: 'newMerchants', icon: UserPlus   },
        { name: 'Images Generated',       value: imagesGenerated.toLocaleString(),      key: 'images',      icon: ImageIcon   },
        { name: 'AI Studio runs (total)', value: aiStudioRunsTotal.toLocaleString(),    key: 'aiStudio',    icon: Zap        },
        { name: 'Credits Issued',         value: totalCreditsIssued.toLocaleString(),   key: 'credits',     icon: CreditCard  },
        { name: 'On Paid Plan',           value: merchantsWithPlan.toLocaleString(),    key: 'plans',       icon: Store       },
    ];

    const formatDate = (iso) => {
        if (!iso) return '—';
        const date = new Date(iso);
        const now  = new Date();
        const diff = now - date;
        if (diff < 86_400_000)  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 604_800_000) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <AdminLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Dashboard' }]}
        >
            <div className="space-y-6">

                {/* ── Stat cards ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Key metrics</span>
                    <Link
                        href="/admin/analytics"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                        <BarChart3 size={16} />
                        Full analytics
                    </Link>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                    {stats.map((stat) => {
                        const Icon  = stat.icon;
                        const style = STAT_CONFIG[stat.key] || STAT_CONFIG.plans;
                        return (
                            <div
                                key={stat.name}
                                className="card flex items-start gap-4"
                            >
                                <div className={`rounded-lg p-2.5 flex-shrink-0 ${style.bg}`}>
                                    <Icon size={20} className={style.icon} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {stat.name}
                                    </p>
                                    <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                                        {stat.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Recent panels ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                    {/* Recent merchants */}
                    <div className="card-base overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Recent merchants
                            </h2>
                            <Link
                                href="/admin/merchants"
                                className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                            {recentMerchants.length === 0 ? (
                                <div className="px-6 py-10 text-center">
                                    <Store size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No merchants yet</p>
                                </div>
                            ) : (
                                recentMerchants.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                                {m.store_name || m.domain || '—'}
                                            </p>
                                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                                {m.domain}
                                            </p>
                                        </div>
                                        <div className="ml-4 flex flex-shrink-0 items-center gap-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {m.plan_name}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                                                {formatDate(m.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent AI generations */}
                    <div className="card-base overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Recent generations
                            </h2>
                        </div>
                        <div className="p-6">
                            {recentImages.length === 0 ? (
                                <div className="py-10 text-center">
                                    <ImageIcon size={28} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        No images generated yet
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {recentImages.map((img) => (
                                        <a
                                            key={img.id}
                                            href={img.generated_image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                        >
                                            <div className="aspect-square relative bg-gray-200 dark:bg-gray-700">
                                                <img
                                                    src={img.generated_image_url}
                                                    alt={`Generated image from ${img.store_name || 'Store'}`}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white truncate">
                                                    {img.store_name || 'Store'}
                                                </span>
                                            </div>
                                            <span className="px-1 py-0.5 truncate text-[10px] text-gray-500 dark:text-gray-400">
                                                {formatDate(img.created_at)}
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
