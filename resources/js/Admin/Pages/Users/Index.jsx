import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Plus, Users } from 'lucide-react';
import ActionButtons from '@/Admin/Components/ActionButtons';

const STATUS_CLS = {
    active:   'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    inactive: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400',
};

const ROLE_CLS = {
    super_admin: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300',
    admin:       'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300',
    viewer:      'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400',
};

const roleLabel = (r) =>
    (r ?? 'admin').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : '—';

export default function UsersIndex({ users }) {
    const items = users?.data ?? [];

    return (
        <AdminLayout
            title="User Management"
            breadcrumbs={[{ label: 'Users' }]}
            headerActions={
                <Link href="/admin/users/create" className="btn btn-primary">
                    <Plus size={14} className="mr-1.5" />
                    Add Team User
                </Link>
            }
        >
            <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                                {['User', 'Email', 'Role', 'Status', 'Created', 'Actions'].map((col, i) => (
                                    <th
                                        key={col}
                                        scope="col"
                                        className={[
                                            'py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                            i === 0 ? 'pl-6 pr-4 text-left' : i === 5 ? 'pl-4 pr-6 text-right' : 'px-4 text-left',
                                        ].join(' ')}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
                            {items.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >
                                    <td className="whitespace-nowrap py-3.5 pl-6 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-white">
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {user.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300">
                                        {user.email}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5">
                                        <span className={[
                                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                            user.admin_role
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                : ROLE_CLS[user.role] ?? ROLE_CLS.admin,
                                        ].join(' ')}>
                                            {user.admin_role?.name ?? roleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5">
                                        <span className={[
                                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                            STATUS_CLS[user.status] ?? STATUS_CLS.active,
                                        ].join(' ')}>
                                            <span className={[
                                                'w-1.5 h-1.5 rounded-full',
                                                user.status === 'active' ? 'bg-green-500' : 'bg-gray-400',
                                            ].join(' ')} />
                                            {user.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap py-3.5 pl-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <ActionButtons
                                                viewHref={`/admin/users/${user.id}`}
                                                editHref={`/admin/users/${user.id}/edit`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-14 text-center">
                                        <Users size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">No users found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users?.last_page > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-6 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Showing{' '}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {(users.current_page - 1) * users.per_page + 1}
                            </span>
                            {' – '}
                            <span className="font-medium text-gray-900 dark:text-white">
                                {Math.min(users.current_page * users.per_page, users.total)}
                            </span>
                            {' of '}
                            <span className="font-medium text-gray-900 dark:text-white">{users.total}</span>
                        </p>
                        <div className="flex gap-2">
                            {users.prev_page_url
                                ? <Link href={users.prev_page_url} className="btn btn-secondary">Previous</Link>
                                : <span className="btn btn-secondary opacity-40 cursor-not-allowed">Previous</span>
                            }
                            {users.next_page_url
                                ? <Link href={users.next_page_url} className="btn btn-secondary">Next</Link>
                                : <span className="btn btn-secondary opacity-40 cursor-not-allowed">Next</span>
                            }
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
