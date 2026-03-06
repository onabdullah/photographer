import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function UserEdit({ user, roles }) {
    const { data, setData, put, processing, errors } = useForm({
        name:           user.name         ?? '',
        email:          user.email        ?? '',
        role:           user.role         ?? 'admin',
        admin_role_id:  user.admin_role_id ?? '',
        status:         user.status       ?? 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        put(`/admin/users/${user.id}`);
    };

    return (
        <AdminLayout
            title="Edit User"
            breadcrumbs={[
                { label: 'Users', href: '/admin/users' },
                { label: user.name, href: `/admin/users/${user.id}` },
                { label: 'Edit' },
            ]}
            headerActions={
                <Link href={`/admin/users/${user.id}`} className="btn btn-secondary">
                    <ArrowLeft size={14} className="mr-1.5" />
                    Back to User
                </Link>
            }
        >
            <form onSubmit={submit} className="space-y-6 max-w-xl">
                <div className="card space-y-4">

                    {/* Name */}
                    <div>
                        <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="form-input"
                        />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="form-label">Email Address <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="form-input"
                            autoComplete="email"
                        />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    {/* System role */}
                    <div>
                        <label className="form-label">System Role</label>
                        <select
                            value={data.role}
                            onChange={(e) => setData('role', e.target.value)}
                            className="form-input"
                        >
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="viewer">Viewer</option>
                        </select>
                        {errors.role && <p className="form-error">{errors.role}</p>}
                    </div>

                    {/* Custom role */}
                    {roles?.length > 0 && (
                        <div>
                            <label className="form-label">Custom Role</label>
                            <select
                                value={data.admin_role_id}
                                onChange={(e) => setData('admin_role_id', e.target.value)}
                                className="form-input"
                            >
                                <option value="">— None —</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                            {errors.admin_role_id && <p className="form-error">{errors.admin_role_id}</p>}
                        </div>
                    )}

                    {/* Status */}
                    <div>
                        <label className="form-label">Status</label>
                        <select
                            value={data.status}
                            onChange={(e) => setData('status', e.target.value)}
                            className="form-input"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        {errors.status && <p className="form-error">{errors.status}</p>}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Saving…' : 'Save Changes'}
                    </button>
                    <Link href={`/admin/users/${user.id}`} className="btn btn-secondary">Cancel</Link>
                </div>
            </form>
        </AdminLayout>
    );
}
