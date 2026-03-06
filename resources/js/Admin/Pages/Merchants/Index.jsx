import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Store } from 'lucide-react';

export default function MerchantsIndex({ merchants }) {
    const paginator = merchants;
    const items     = paginator?.data ?? [];

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
            subtitle="All installed stores and their usage"
            breadcrumbs={[{ label: 'Management' }, { label: 'Merchants' }]}
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
                                        <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                                            {Number(m.ai_credits_balance ?? 0).toLocaleString()}
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
                                    <Link href={paginator.prev_page_url} className="btn-secondary text-sm px-3 py-1.5">
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="btn-secondary opacity-40 cursor-not-allowed text-sm px-3 py-1.5">
                                        Previous
                                    </span>
                                )}
                                {paginator.next_page_url ? (
                                    <Link href={paginator.next_page_url} className="btn-secondary text-sm px-3 py-1.5">
                                        Next
                                    </Link>
                                ) : (
                                    <span className="btn-secondary opacity-40 cursor-not-allowed text-sm px-3 py-1.5">
                                        Next
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    );
}
