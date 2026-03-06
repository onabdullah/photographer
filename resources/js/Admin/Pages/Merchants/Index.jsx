import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';

/**
 * Admin Merchants list – real data: plan name, credits, images generated, pagination.
 */
export default function Index({ merchants }) {
    const paginator = merchants;
    const items = paginator?.data ?? [];

    const planName = (m) => {
        if (m.shopify_freemium) return 'Free';
        return m.plan?.name ?? (m.plan_id ? `Plan #${m.plan_id}` : 'None');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Merchants</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Installed stores and usage
                    </p>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pl-6">
                                        Store
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        Domain
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        Contact
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        Owner
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        Plan
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pr-6">
                                        Credits
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-600 sm:pr-6">
                                        Images
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        Installed
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {items.map((merchant) => (
                                    <tr key={merchant.id} className="hover:bg-gray-50/50">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {merchant.store_name || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                                            {merchant.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {merchant.email || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {merchant.shop_owner || '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4">
                                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                                {planName(merchant)}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm tabular-nums text-gray-600 sm:pr-6">
                                            {Number(merchant.ai_credits_balance ?? 0).toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm tabular-nums text-gray-600 sm:pr-6">
                                            {Number(merchant.images_generated_count ?? 0).toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {merchant.created_at
                                                ? new Date(merchant.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                                            No merchants installed yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paginator?.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
                            <p className="text-sm text-gray-600">
                                Showing{' '}
                                <span className="font-medium">{(paginator.current_page - 1) * paginator.per_page + 1}</span>
                                {' '}-{' '}
                                <span className="font-medium">
                                    {Math.min(paginator.current_page * paginator.per_page, paginator.total)}
                                </span>
                                {' '}of <span className="font-medium">{paginator.total}</span>
                            </p>
                            <div className="flex gap-2">
                                {paginator.prev_page_url ? (
                                    <Link
                                        href={paginator.prev_page_url}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#468A9A] focus:ring-offset-2"
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
                                        Previous
                                    </span>
                                )}
                                {paginator.next_page_url ? (
                                    <Link
                                        href={paginator.next_page_url}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#468A9A] focus:ring-offset-2"
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 cursor-not-allowed">
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
