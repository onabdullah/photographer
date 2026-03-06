import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { TOTAL_PERMISSIONS, ALL_PERMISSION_KEYS } from '@/Admin/constants';

// ── Shared permission selector ────────────────────────────────────────────────

function PermissionGrid({ allPermissions, selected, onChange }) {
    const total = ALL_PERMISSION_KEYS.length;

    const togglePerm = (key) => {
        onChange(
            selected.includes(key)
                ? selected.filter((k) => k !== key)
                : [...selected, key],
        );
    };

    const toggleGroup = (groupKeys) => {
        const allOn = groupKeys.every((k) => selected.includes(k));
        onChange(
            allOn
                ? selected.filter((k) => !groupKeys.includes(k))
                : [...new Set([...selected, ...groupKeys])],
        );
    };

    const selectAll  = () => onChange([...ALL_PERMISSION_KEYS]);
    const deselectAll = () => onChange([]);

    return (
        <div className="space-y-5">
            {/* Global select/deselect bar */}
            <div className="flex items-center gap-3">
                <button type="button" onClick={selectAll}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                    <CheckCircle2 size={13} />
                    Select All
                </button>
                <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                <button type="button" onClick={deselectAll}
                    className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                    Deselect All
                </button>
                <span className="ml-auto text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                    {selected.length}
                    <span className="text-gray-400 dark:text-gray-500">/{total}</span>
                    <span className="ml-1 text-gray-400 dark:text-gray-500 font-normal">selected</span>
                </span>
            </div>

            {/* Groups grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(allPermissions).map(([groupName, perms]) => {
                    const groupKeys  = Object.keys(perms);
                    const selCount   = groupKeys.filter((k) => selected.includes(k)).length;
                    const allGroupOn = selCount === groupKeys.length;

                    return (
                        <div key={groupName}
                            className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                        >
                            {/* Group header */}
                            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        {groupName}
                                    </span>
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
                                        {groupKeys.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(groupKeys)}
                                    className={[
                                        'text-[10px] font-bold transition-colors',
                                        allGroupOn
                                            ? 'text-red-500 dark:text-red-400 hover:text-red-700'
                                            : 'text-primary-600 dark:text-primary-400 hover:text-primary-700',
                                    ].join(' ')}
                                >
                                    {allGroupOn ? '− Deselect' : '+ All'}
                                </button>
                            </div>

                            {/* Permission items */}
                            <div className="p-2 space-y-0.5 bg-white dark:bg-gray-800">
                                {groupKeys.map((key) => {
                                    const on = selected.includes(key);
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => togglePerm(key)}
                                            className={[
                                                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                                                on
                                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/40',
                                            ].join(' ')}
                                        >
                                            {on
                                                ? <CheckCircle2 size={15} className="flex-shrink-0 text-primary-500 dark:text-primary-400" />
                                                : <Circle       size={15} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
                                            }
                                            <span className={[
                                                'text-xs',
                                                on
                                                    ? 'text-primary-700 dark:text-primary-300 font-medium'
                                                    : 'text-gray-600 dark:text-gray-400',
                                            ].join(' ')}>
                                                {perms[key]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Create Role page ──────────────────────────────────────────────────────────

export default function RoleCreate({ allPermissions }) {
    const { data, setData, post, processing, errors } = useForm({
        name:        '',
        permissions: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/roles');
    };

    return (
        <AdminLayout
            title="Create Role"
            breadcrumbs={[{ label: 'Roles', href: '/admin/roles' }, { label: 'Create' }]}
            centerHeader
            headerActions={
                <Link href="/admin/roles" className="btn btn-secondary">
                    <ArrowLeft size={14} className="mr-1.5" />
                    Back to Roles
                </Link>
            }
        >
            <form onSubmit={submit} className="space-y-6 max-w-5xl mx-auto">

                {/* Role name */}
                <div className="card">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1 max-w-xs">
                            <label className="form-label">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g. Manager, Editor, Viewer"
                                className="form-input"
                                autoFocus
                            />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                    </div>
                </div>

                {/* Permissions */}
                <div className="card">
                    <div className="mb-4 pb-3 border-b border-gray-100 dark:border-gray-700/60">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Permissions
                        </p>
                    </div>
                    <PermissionGrid
                        allPermissions={allPermissions}
                        selected={data.permissions}
                        onChange={(perms) => setData('permissions', perms)}
                    />
                    {errors.permissions && <p className="form-error mt-3">{errors.permissions}</p>}
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Creating…' : 'Create Role'}
                    </button>
                    <Link href="/admin/roles" className="btn btn-secondary">Cancel</Link>
                </div>
            </form>
        </AdminLayout>
    );
}
