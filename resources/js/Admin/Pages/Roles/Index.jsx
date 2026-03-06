import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { Plus, Shield } from 'lucide-react';
import ActionButtons from '@/Admin/Components/ActionButtons';

export default function RolesIndex({ roles, totalPermissions }) {
    const formatDate = (iso) =>
        iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

    return (
        <AdminLayout
            title="Role Management"
            breadcrumbs={[{ label: 'Roles' }]}
            headerActions={
                <Link href="/admin/roles/create" className="btn btn-primary">
                    <Plus size={14} className="mr-1.5" />
                    New Role
                </Link>
            }
        >
            <div className="card-base overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800/60">
                            <tr>
                                {['Role Name', 'Permissions', 'Users', 'Created', 'Actions'].map((col, i) => (
                                    <th
                                        key={col}
                                        scope="col"
                                        className={[
                                            'py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
                                            i === 0 ? 'pl-6 pr-4 text-left' : i === 4 ? 'pr-6 pl-4 text-right' : 'px-4 text-left',
                                        ].join(' ')}
                                    >
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
                            {roles.map((role) => (
                                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="whitespace-nowrap py-3.5 pl-6 pr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                                                <Shield size={15} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {role.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5">
                                        <span className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                                            {role.permissions_count}
                                            <span className="text-gray-400 dark:text-gray-500">/{totalPermissions}</span>
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-600 dark:text-gray-300 tabular-nums">
                                        {role.users_count}
                                    </td>
                                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(role.created_at)}
                                    </td>
                                    <td className="whitespace-nowrap py-3.5 pl-4 pr-6 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <ActionButtons
                                                viewHref={`/admin/roles/${role.id}`}
                                                editHref={`/admin/roles/${role.id}/edit`}
                                                onDelete={() => {
                                                    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
                                                    import('@inertiajs/react').then(({ router }) =>
                                                        router.delete(`/admin/roles/${role.id}`)
                                                    );
                                                }}
                                                deleteConfirmMessage={`Delete role "${role.name}"? This cannot be undone.`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {roles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-14 text-center">
                                        <Shield size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">No roles yet</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Create your first role to start managing permissions.
                                        </p>
                                        <Link href="/admin/roles/create" className="btn btn-primary mt-4 inline-flex">
                                            <Plus size={14} className="mr-1.5" /> New Role
                                        </Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
