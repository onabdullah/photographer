import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Users, Image as ImageIcon, CreditCard, Store } from 'lucide-react';

/**
 * Admin Dashboard - Main overview with real stats and recent activity
 * Uses exact data from backend; professional, aesthetic layout.
 */
const STAT_CARD_STYLES = {
    merchants: { bg: 'bg-[#468A9A]/10', icon: 'text-[#468A9A]' },
    images: { bg: 'bg-[#468A9A]/10', icon: 'text-[#468A9A]' },
    credits: { bg: 'bg-[#FF7A30]/10', icon: 'text-[#FF7A30]' },
    plans: { bg: 'bg-gray-100', icon: 'text-gray-600' },
};

export default function Dashboard({ data }) {
    const d = data || {};
    const totalMerchants = Number(d.totalMerchants) ?? 0;
    const imagesGenerated = Number(d.imagesGenerated) ?? 0;
    const totalCreditsIssued = Number(d.totalCreditsIssued) ?? 0;
    const merchantsWithPlan = Number(d.merchantsWithPlan) ?? 0;
    const recentMerchants = d.recentMerchants ?? [];
    const recentImages = d.recentImages ?? [];

    const stats = [
        { name: 'Total Merchants', value: totalMerchants.toLocaleString(), key: 'merchants', icon: Users },
        { name: 'Images Generated', value: imagesGenerated.toLocaleString(), key: 'images', icon: ImageIcon },
        { name: 'Total Credits Issued', value: totalCreditsIssued.toLocaleString(), key: 'credits', icon: CreditCard },
        { name: 'On Paid Plan', value: merchantsWithPlan.toLocaleString(), key: 'plans', icon: Store },
    ];

    const formatDate = (iso) => {
        if (!iso) return '—';
        const date = new Date(iso);
        const now = new Date();
        const diff = now - date;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diff < 604800000) return date.toLocaleDateString([], { weekday: 'short' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Platform overview and recent activity
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        const style = STAT_CARD_STYLES[stat.key] || STAT_CARD_STYLES.plans;
                        return (
                            <div
                                key={stat.name}
                                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`rounded-lg p-2.5 ${style.bg}`}>
                                            <Icon className={`h-5 w-5 ${style.icon}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                            <p className="mt-0.5 text-2xl font-semibold text-gray-900 tabular-nums">
                                                {stat.value}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Recent merchants */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-gray-900">Recent merchants</h2>
                                <Link
                                    href="/admin/merchants"
                                    className="text-sm font-medium text-[#468A9A] hover:underline focus:outline-none focus:ring-2 focus:ring-[#468A9A] focus:ring-offset-2 rounded"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recentMerchants.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm text-gray-500">
                                    No merchants yet
                                </div>
                            ) : (
                                recentMerchants.map((m) => (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between px-5 py-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {m.store_name || m.domain || '—'}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">{m.domain}</p>
                                        </div>
                                        <div className="ml-4 flex shrink-0 items-center gap-3">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                                {m.plan_name}
                                            </span>
                                            <span className="text-xs text-gray-400 tabular-nums">
                                                {formatDate(m.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent generations */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-4">
                            <h2 className="text-base font-semibold text-gray-900">Recent generations</h2>
                        </div>
                        <div className="p-5">
                            {recentImages.length === 0 ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    No images generated yet
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-3">
                                    {recentImages.map((img) => (
                                        <a
                                            key={img.id}
                                            href={img.generated_image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col rounded-lg border border-gray-100 bg-gray-50 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#468A9A] focus:ring-offset-2"
                                        >
                                            <div className="aspect-square relative bg-gray-200">
                                                <img
                                                    src={img.generated_image_url}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5 text-[10px] text-white truncate">
                                                    {img.store_name || 'Store'}
                                                </span>
                                            </div>
                                            <span className="mt-1 truncate text-xs text-gray-500">
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
