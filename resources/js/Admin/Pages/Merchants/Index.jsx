import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Search, Store, Pencil, CreditCard, Sparkles, CalendarPlus, ShieldCheck, BarChart3, Filter, Crown } from 'lucide-react';

const PLAN_TAG_CLS = {
    free: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 ring-1 ring-gray-500/20',
    paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20',
    none: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20',
};

export default function MerchantsIndex({ merchants, quickStats, filters }) {
    const paginator = merchants;
    const items     = paginator?.data ?? [];
    const stats = quickStats ?? {};
    const initialFilters = filters ?? {};
    const { auth } = usePage().props;
    const permissions = auth?.user?.permissions ?? [];
    const canEditCredits = permissions.includes('*') || permissions.includes('merchants.edit_credits');

    const [editingCredits, setEditingCredits] = useState(null); // { id, store_name, value }
    const [creditsInput, setCreditsInput] = useState('');
    const [search, setSearch] = useState(initialFilters.q ?? '');
    const [planFilter, setPlanFilter] = useState(initialFilters.plan ?? 'all');
    const [sortBy, setSortBy] = useState(initialFilters.sort ?? 'latest');
    const [showFilters, setShowFilters] = useState(false);

    const [detailsMerchant, setDetailsMerchant] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState('');
    const [detailsData, setDetailsData] = useState(null);

    const applyFilters = () => {
        const query = {
            q: search || undefined,
            plan: planFilter,
            sort: sortBy,
        };

        router.get('/admin/merchants', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        setSearch('');
        setPlanFilter('all');
        setSortBy('latest');

        router.get('/admin/merchants', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const openDetailsModal = async (merchant) => {
        setDetailsMerchant(merchant);
        setDetailsLoading(true);
        setDetailsError('');
        setDetailsData(null);

        try {
            const response = await fetch(`/admin/merchants/${merchant.id}/insights`, {
                headers: {
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error('Failed to load merchant insights.');
            }

            const data = await response.json();
            setDetailsData(data);
        } catch (error) {
            setDetailsError(error?.message || 'Unable to load merchant insights.');
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetailsModal = () => {
        setDetailsMerchant(null);
        setDetailsLoading(false);
        setDetailsError('');
        setDetailsData(null);
    };

    const openEditCredits = (m) => {
        setEditingCredits({ id: m.id, store_name: m.store_name || m.name });
        setCreditsInput(String(m.ai_credits_balance ?? 0));
    };
    const closeEditCredits = () => {
        setEditingCredits(null);
        setCreditsInput('');
    };
    const saveCredits = () => {
        if (editingCredits == null) return;
        const value = Math.max(0, parseInt(creditsInput, 10));
        if (Number.isNaN(value)) return;
        router.patch(`/admin/merchants/${editingCredits.id}/credits`, { ai_credits_balance: value }, {
            preserveScroll: true,
            onSuccess: () => closeEditCredits(),
        });
    };

    const planName = (m) => {
        if (m.shopify_freemium) return 'Free';
        return m.plan?.name ?? (m.plan_id ? `Plan #${m.plan_id}` : 'None');
    };

    const planTagClass = (m) => {
        if (m.shopify_freemium) return PLAN_TAG_CLS.free;
        if (m.plan_id) return PLAN_TAG_CLS.paid;
        return PLAN_TAG_CLS.none;
    };

    const isPaidPlan = (m) => !m.shopify_freemium && !!m.plan_id;

    const formatDate = (iso) =>
        iso
            ? new Date(iso).toLocaleDateString(undefined, {
                  month: 'short',
                  day:   'numeric',
                  year:  'numeric',
              })
            : '—';

    return (
        <AdminLayout
            title="Merchants"
            breadcrumbs={[{ label: 'Merchants' }]}
        >
            <div className="space-y-5">
                <div className="card-base p-4">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Showing {items.length} merchant(s) on this page • {Number(paginator?.total ?? 0).toLocaleString()} total matches
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowFilters((prev) => !prev)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            aria-expanded={showFilters}
                            aria-label="Toggle filters"
                        >
                            <Filter size={15} />
                            Filters
                        </button>
                    </div>

                    {showFilters && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-2">
                                    <label className="form-label">Search merchants</label>
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                            placeholder="Store, domain, email, or owner"
                                            className="form-input pl-9"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Plan</label>
                                    <select className="form-input" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
                                        <option value="all">All</option>
                                        <option value="paid">Paid</option>
                                        <option value="free">Free</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">Sort</label>
                                    <select className="form-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                        <option value="latest">Latest install</option>
                                        <option value="credits_desc">Highest credits</option>
                                        <option value="images_desc">Most images generated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-end gap-2">
                                <button type="button" onClick={resetFilters} className="btn btn-secondary">Reset</button>
                                <button type="button" onClick={applyFilters} className="btn btn-primary">Apply Filters</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="card-base p-4">
                        <div className="flex items-start justify-between">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Merchants</p>
                            <Store size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {Number(stats.total_merchants ?? 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="card-base p-4">
                        <div className="flex items-start justify-between">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">On Paid Plan</p>
                            <ShieldCheck size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {Number(stats.merchants_with_plan ?? 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="card-base p-4">
                        <div className="flex items-start justify-between">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">New (7 Days)</p>
                            <CalendarPlus size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {Number(stats.new_last_7_days ?? 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="card-base p-4">
                        <div className="flex items-start justify-between">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Credits in Circulation</p>
                            <CreditCard size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {Number(stats.total_credits_issued ?? 0).toLocaleString()}
                        </p>
                    </div>

                    <div className="card-base p-4">
                        <div className="flex items-start justify-between">
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Images</p>
                            <Sparkles size={15} className="text-gray-400" />
                        </div>
                        <p className="mt-2 text-xl font-semibold tabular-nums text-gray-900 dark:text-white">
                            {Number(stats.total_completed_images ?? 0).toLocaleString()}
                        </p>
                    </div>
                </div>

                {items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((m) => (
                            <div key={m.id} className="card-base p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {m.store_name || m.name || '—'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.name || '—'}</p>
                                    </div>
                                    <span className={[
                                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap',
                                        planTagClass(m),
                                    ].join(' ')}>
                                        {isPaidPlan(m) && <Crown size={12} className="opacity-90" />}
                                        {planName(m)}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact</p>
                                        <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.email || '—'}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Owner</p>
                                        <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{m.shop_owner || m.email || '—'}</p>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Credits</p>
                                        <div className="mt-1 inline-flex items-center gap-1.5">
                                            <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                                                {Number(m.ai_credits_balance ?? 0).toLocaleString()}
                                            </p>
                                            {canEditCredits && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEditCredits(m)}
                                                    className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-500/10 dark:hover:text-primary-400 dark:hover:bg-primary-500/20 transition-colors"
                                                    aria-label={`Edit credits for ${m.store_name || m.name}`}
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Images Generated</p>
                                        <p className="mt-1 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                                            {Number(m.images_generated_count ?? 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Installed {formatDate(m.created_at)}</span>
                                    <button
                                        type="button"
                                        onClick={() => openDetailsModal(m)}
                                        className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-base px-6 py-14 text-center">
                        <Store size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">No merchants yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Merchants appear here once they install the app.
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {paginator?.last_page > 1 && (
                    <div className="card-base px-6 py-3 flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing{' '}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {(paginator.current_page - 1) * paginator.per_page + 1}
                            </span>
                            {' – '}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {Math.min(paginator.current_page * paginator.per_page, paginator.total)}
                            </span>
                            {' of '}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {paginator.total}
                            </span>
                        </p>
                        <div className="flex gap-2">
                            {paginator.prev_page_url ? (
                                <Link href={paginator.prev_page_url} className="btn btn-secondary">
                                    Previous
                                </Link>
                            ) : (
                                <span className="btn btn-secondary opacity-40 cursor-not-allowed">
                                    Previous
                                </span>
                            )}
                            {paginator.next_page_url ? (
                                <Link href={paginator.next_page_url} className="btn btn-secondary">
                                    Next
                                </Link>
                            ) : (
                                <span className="btn btn-secondary opacity-40 cursor-not-allowed">
                                    Next
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Merchant details modal */}
                {detailsMerchant && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="merchant-details-title"
                        onClick={closeDetailsModal}
                    >
                        <div
                            className="card-base w-full max-w-4xl p-5 shadow-xl max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <h2 id="merchant-details-title" className="text-base font-semibold text-gray-900 dark:text-white">
                                        Merchant Insights
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {detailsData?.merchant?.store_name || detailsMerchant.store_name || detailsMerchant.name}
                                    </p>
                                </div>
                                <button type="button" onClick={closeDetailsModal} className="btn btn-secondary">Close</button>
                            </div>

                            {detailsLoading && (
                                <div className="py-14 text-center">
                                    <BarChart3 size={26} className="mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">Loading merchant analytics...</p>
                                </div>
                            )}

                            {!detailsLoading && detailsError && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                                    {detailsError}
                                </div>
                            )}

                            {!detailsLoading && !detailsError && detailsData && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Credits Used</p>
                                            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                                                {Number(detailsData.usage?.total_credits_used ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Monthly Credits Used</p>
                                            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                                                {Number(detailsData.usage?.monthly_credits_used ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Completed Generations</p>
                                            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                                                {Number(detailsData.usage?.completed_generations ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Balance</p>
                                            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                                                {Number(detailsData.credit_breakdown?.current_balance ?? 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Monthly plan usage</p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {detailsData.usage?.monthly_usage_percentage != null
                                                    ? `${detailsData.usage.monthly_usage_percentage}%`
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                            <div
                                                className="h-2 rounded-full bg-primary-600"
                                                style={{ width: `${Math.min(100, Number(detailsData.usage?.monthly_usage_percentage ?? 0))}%` }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            {Number(detailsData.usage?.monthly_credits_used ?? 0).toLocaleString()} used out of {Number(detailsData.merchant?.monthly_plan_credits ?? 0).toLocaleString()} monthly plan credits.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Most used tools</p>
                                            <div className="space-y-2">
                                                {(detailsData.top_tools ?? []).length > 0 ? (detailsData.top_tools ?? []).map((tool) => (
                                                    <div key={tool.tool} className="flex items-center justify-between text-sm">
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{tool.tool}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{tool.runs} runs</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold tabular-nums text-gray-900 dark:text-white">{Number(tool.credits_used).toLocaleString()} credits</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">{tool.share_percentage}% share</p>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">No tool usage data yet.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Credit breakdown</p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Plan cycle used</span>
                                                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{Number(detailsData.credit_breakdown?.plan_cycle_used ?? 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Plan cycle remaining</span>
                                                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{Number(detailsData.credit_breakdown?.plan_cycle_remaining ?? 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Top-up credits</span>
                                                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{Number(detailsData.credit_breakdown?.top_up_credits ?? 0).toLocaleString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-500 dark:text-gray-400">Plan cycle allocation</span>
                                                    <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{Number(detailsData.credit_breakdown?.plan_cycle_credits ?? 0).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">Recent activity</p>
                                        <div className="space-y-2">
                                            {(detailsData.recent_activity ?? []).length > 0 ? (detailsData.recent_activity ?? []).map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between rounded border border-gray-100 dark:border-gray-800 px-3 py-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.tool}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(entry.created_at)} • {entry.status}</p>
                                                    </div>
                                                    <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                                                        {Number(entry.credits_used ?? 0).toLocaleString()} credits
                                                    </p>
                                                </div>
                                            )) : (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity available.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Edit credits modal */}
                {editingCredits && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-credits-title"
                        onClick={closeEditCredits}
                    >
                        <div className="card-base w-full max-w-sm p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h2 id="edit-credits-title" className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                Edit credits
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                {editingCredits.store_name}
                            </p>
                            <label className="form-label">Credits</label>
                            <input
                                type="number"
                                min={0}
                                step={1}
                                value={creditsInput}
                                onChange={(e) => setCreditsInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveCredits()}
                                className="form-input mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={closeEditCredits} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="button" onClick={saveCredits} className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
