import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Store, Pencil } from 'lucide-react';

export default function MerchantsIndex({ merchants }) {
    const paginator = merchants;
    const items     = paginator?.data ?? [];
    const { auth } = usePage().props;
    const permissions = auth?.user?.permissions ?? [];
    const canManage = permissions.includes('*') || permissions.includes('merchants.manage');

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

                {/* Table card */}
                <div className="card-base overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800/60">
                                <tr>
                                    {['Store', 'Domain', 'Contact', 'Owner', 'Plan', 'Credits', 'Images', 'Installed'].map((col, i) => (
                                        <th
                                            key={col}
                                            scope="col"
                                            className={[
                                                'py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                                i === 0 ? 'pl-6 pr-3' : i === 5 || i === 6 ? 'px-4 text-right' : 'px-4',
                                            ].join(' ')}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
                                {items.map((m) => (
                                    <tr
                                        key={m.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {m.store_name || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                                            {m.name}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {m.email || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {m.shop_owner || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {planName(m)}
                                            </span>
                                        </td>
                                        <td
                                            className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <span className="inline-flex items-center justify-end gap-1.5 w-full">
                                                {Number(m.ai_credits_balance ?? 0).toLocaleString()}
                                                {canManage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditCredits(m)}
                                                        className="p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-500/10 dark:hover:text-primary-400 dark:hover:bg-primary-500/20 transition-colors"
                                                        aria-label={`Edit credits for ${m.store_name || m.name}`}
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                                            {Number(m.images_generated_count ?? 0).toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(m.created_at)}
                                        </td>
                                    </tr>
                                ))}

                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-14 text-center">
                                            <Store size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">No merchants yet</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                Merchants appear here once they install the app.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {paginator?.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-6 py-3">
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
                </div>

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
