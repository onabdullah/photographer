import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Edit, Shield, CheckCircle2 } from 'lucide-react';

export default function RoleShow({ role, allPermissions }) {
    const groups = Object.entries(allPermissions);
    const grantedSet = new Set(role.permissions ?? []);

    return (
        <AdminLayout
            title={role.name}
            breadcrumbs={[{ label: 'Roles', href: '/admin/roles' }, { label: role.name }]}
            headerActions={
                <div className="flex items-center gap-2">
                    <Link href="/admin/roles" className="btn btn-secondary">
                        <ArrowLeft size={14} className="mr-1.5" />
                        Back to Roles
                    </Link>
                    <Link href={`/admin/roles/${role.id}/edit`} className="btn btn-primary">
                        <Edit size={14} className="mr-1.5" />
                        Edit Role
                    </Link>
                </div>
            }
            centerHeader
        >
            <div className="flex flex-col lg:flex-row gap-6">

                {/* ── Left: Permissions Grid ── */}
                <div className="flex-1 min-w-0">
                    <div className="card">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Permissions
                            </h2>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
                                {role.permissions_count} total
                            </span>
                        </div>

                        {/* Groups grid — 3 columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groups.map(([groupName, perms]) => {
                                const keys    = Object.keys(perms);
                                const granted = keys.filter((k) => grantedSet.has(k));
                                return (
                                    <div
                                        key={groupName}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                                    >
                                        {/* Group header */}
                                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {groupName}
                                            </span>
                                            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tabular-nums">
                                                {granted.length}
                                            </span>
                                        </div>
                                        {/* Permission items */}
                                        <div className="p-2 space-y-1 bg-white dark:bg-gray-800">
                                            {keys.map((key) => {
                                                const active = grantedSet.has(key);
                                                return (
                                                    <div key={key} className="flex items-center gap-2 px-2 py-1.5 rounded-md">
                                                        <CheckCircle2
                                                            size={15}
                                                            className={active
                                                                ? 'text-primary-500 dark:text-primary-400 flex-shrink-0'
                                                                : 'text-gray-200 dark:text-gray-700 flex-shrink-0'
                                                            }
                                                        />
                                                        <span className={[
                                                            'text-xs',
                                                            active
                                                                ? 'text-gray-800 dark:text-gray-200 font-medium'
                                                                : 'text-gray-400 dark:text-gray-600',
                                                        ].join(' ')}>
                                                            {perms[key]}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Right: Info + Actions ── */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

                    {/* Role info card */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary-600/10 dark:bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                                <Shield size={18} className="text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{role.name}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {[
                                { label: 'Role ID',     value: role.id },
                                { label: 'Users',       value: role.users_count },
                                { label: 'Permissions', value: role.permissions_count },
                                { label: 'Created',     value: role.created_at },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="card">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Actions
                        </p>
                        <div className="space-y-2">
                            <Link
                                href={`/admin/roles/${role.id}/edit`}
                                className="btn btn-primary w-full justify-center"
                            >
                                <Edit size={14} className="mr-1.5" /> Edit Role
                            </Link>
                            <Link
                                href="/admin/roles"
                                className="btn btn-secondary w-full justify-center"
                            >
                                <ArrowLeft size={14} className="mr-1.5" /> Back to Roles
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
