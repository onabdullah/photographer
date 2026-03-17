import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Store, Pencil, CreditCard, Sparkles, CalendarPlus, ShieldCheck } from 'lucide-react';

export default function MerchantsIndex({ merchants, quickStats }) {
    const paginator = merchants;
    const items     = paginator?.data ?? [];
    const stats = quickStats ?? {};
    const { auth } = usePage().props;
    const permissions = auth?.user?.permissions ?? [];
    const canEditCredits = permissions.includes('*') || permissions.includes('merchants.edit_credits');

    const [editingCredits, setEditingCredits] = useState(null); // { id, store_name, value }
    const [creditsInput, setCreditsInput] = useState('');

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
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {items.map((m) => (
                            <div key={m.id} className="card-base p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                            {m.store_name || m.name || '—'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.name || '—'}</p>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 whitespace-nowrap">
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
                                    <Link
                                        href={`/admin/merchants/${m.id}`}
                                        className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
                                    >
                                        View Details
                                    </Link>
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
