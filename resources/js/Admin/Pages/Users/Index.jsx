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
            <div className="space-y-4">
                {items.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {items.map((user) => (
                            <div key={user.id} className="card-base p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-white">
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                    <span className={[
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
                                        STATUS_CLS[user.status] ?? STATUS_CLS.active,
                                    ].join(' ')}>
                                        <span className={[
                                            'w-1.5 h-1.5 rounded-full',
                                            user.status === 'active' ? 'bg-green-500' : 'bg-gray-400',
                                        ].join(' ')} />
                                        {user.status === 'active' ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</p>
                                        <span className={[
                                            'mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                            user.admin_role
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                : ROLE_CLS[user.role] ?? ROLE_CLS.admin,
                                        ].join(' ')}>
                                            {user.admin_role?.name ?? roleLabel(user.role)}
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Created</p>
                                        <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">{formatDate(user.created_at)}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end">
                                    <ActionButtons
                                        viewHref={`/admin/users/${user.id}`}
                                        editHref={`/admin/users/${user.id}/edit`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card-base px-6 py-14 text-center">
                        <Users size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">No users found</p>
                    </div>
                )}

                {/* Pagination */}
                {users?.last_page > 1 && (
                    <div className="card-base px-6 py-3 flex items-center justify-between">
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
