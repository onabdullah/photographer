import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit2, UserX, Trash2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const STATUS_CLS = {
    active:   'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    inactive: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400',
};

const ROLE_CLS = {
    super_admin: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50',
    admin:       'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
    viewer:      'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700/50',
};

function PermissionGroupCard({ groupName, perms, grantedSet }) {
    const [open, setOpen] = useState(true);
    const keys    = Object.keys(perms);
    const granted = keys.filter((k) => grantedSet.has(k));

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                        {groupName}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                        {granted.length}
                    </span>
                </div>
                {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
            </button>

            {open && (
                <div className="p-2 space-y-0.5 bg-white dark:bg-gray-800">
                    {keys.map((key) => {
                        const on = grantedSet.has(key);
                        return (
                            <div key={key} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md">
                                <CheckCircle2
                                    size={14}
                                    className={on
                                        ? 'text-primary-500 dark:text-primary-400 flex-shrink-0'
                                        : 'text-gray-200 dark:text-gray-700 flex-shrink-0'
                                    }
                                />
                                <span className={[
                                    'text-xs',
                                    on ? 'text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-400 dark:text-gray-600',
                                ].join(' ')}>
                                    {perms[key]}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function UserShow({ user, allPermissions, roles }) {
    const grantedSet    = new Set(user.permissions ?? []);
    const userInitial   = user.name?.charAt(0)?.toUpperCase() || 'U';
    const roleLabel     = (r) => (r ?? 'admin').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const toggleStatus = () => {
        if (!confirm(`${user.status === 'active' ? 'Deactivate' : 'Activate'} user "${user.name}"?`)) return;
        router.post(`/admin/users/${user.id}/status`);
    };

    return (
        <AdminLayout
            title={user.name}
            breadcrumbs={[{ label: 'Users', href: '/admin/users' }, { label: user.name }]}
            headerActions={
                <div className="flex items-center gap-2">
                    <Link href="/admin/users" className="btn btn-secondary">
                        <ArrowLeft size={14} className="mr-1.5" />
                        Back to Users
                    </Link>
                    <Link href={`/admin/users/${user.id}/edit`} className="btn btn-primary">
                        <Edit2 size={14} className="mr-1.5" />
                        Edit User
                    </Link>
                </div>
            }
            centerHeader
        >
            <div className="flex flex-col lg:flex-row gap-6">

                {/* ── Left panel ── */}
                <div className="flex-1 min-w-0 space-y-5">

                    {/* Profile card */}
                    <div className="card">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg font-bold text-white">{userInitial}</span>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-900 dark:text-white">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <span className={[
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
                                STATUS_CLS[user.status] ?? STATUS_CLS.active,
                            ].join(' ')}>
                                <span className={[
                                    'w-1.5 h-1.5 rounded-full',
                                    user.status === 'active' ? 'bg-green-500' : 'bg-gray-400',
                                ].join(' ')} />
                                {user.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0">
                            {[
                                { label: 'EMAIL',          value: user.email },
                                { label: 'LAST LOGIN',     value: user.last_login_at ?? '—' },
                                { label: 'CREATED',        value: user.created_at ?? '—' },
                                { label: 'EMAIL VERIFIED', value: user.email_verified_at ?? 'Unverified' },
                            ].map(({ label, value }) => (
                                <div key={label} className="py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Roles & Permissions */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Roles & Permissions
                            </p>
                        </div>

                        {/* Assigned role badge */}
                        <div className="mb-4">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                                Assigned Role
                            </p>
                            <span className={[
                                'inline-flex items-center px-3 py-1 rounded text-xs font-semibold',
                                user.admin_role
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50'
                                    : ROLE_CLS[user.role] ?? ROLE_CLS.admin,
                            ].join(' ')}>
                                {user.admin_role?.name ?? roleLabel(user.role)}
                            </span>
                        </div>

                        {/* Permissions groups — 3-column grid */}
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Permissions
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.entries(allPermissions).map(([groupName, perms]) => (
                                <PermissionGroupCard
                                    key={groupName}
                                    groupName={groupName}
                                    perms={perms}
                                    grantedSet={grantedSet}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right panel ── */}
                <div className="w-full lg:w-72 flex-shrink-0 space-y-4">

                    {/* Actions */}
                    <div className="card">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Actions
                        </p>
                        <div className="space-y-2">
                            <Link
                                href={`/admin/users/${user.id}/edit`}
                                className="btn btn-secondary w-full justify-center"
                            >
                                <Edit2 size={14} className="mr-1.5" />
                                Edit User
                            </Link>
                            <button
                                type="button"
                                onClick={toggleStatus}
                                className={[
                                    'btn w-full justify-center',
                                    user.status === 'active'
                                        ? 'btn-secondary text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/10'
                                        : 'btn-secondary text-green-600 dark:text-green-400',
                                ].join(' ')}
                            >
                                <UserX size={14} className="mr-1.5" />
                                {user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                            Quick Stats
                        </p>
                        {[
                            { label: 'User ID',    value: user.id },
                            { label: 'Roles',      value: user.admin_role ? 1 : 1 },
                            { label: 'Permissions',value: (user.permissions ?? []).length },
                            { label: 'Status',     value: user.status === 'active' ? 'Active' : 'Inactive',
                              cls: user.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500' },
                        ].map(({ label, value, cls }) => (
                            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
                                <span className={['text-xs font-semibold text-gray-900 dark:text-white', cls ?? ''].join(' ')}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
