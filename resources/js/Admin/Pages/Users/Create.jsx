import { useForm } from '@inertiajs/react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

export default function UserCreate({ roles }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        admin_role_id: '',
        status: 'active',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/admin/users');
    };

    return (
        <AdminLayout
            title="Add Team User"
            breadcrumbs={[
                { label: 'Users', href: '/admin/users' },
                { label: 'Add Team User' },
            ]}
            headerActions={
                <Link href="/admin/users" className="btn btn-secondary">
                    <ArrowLeft size={14} className="mr-1.5" />
                    Back to Users
                </Link>
            }
            centerHeader
        >
            <form onSubmit={submit} className="space-y-6 max-w-xl">
                <div className="card space-y-4">
                    <div>
                        <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="form-input"
                            autoComplete="name"
                        />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>

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

                    <div>
                        <label className="form-label">Custom Role <span className="text-red-500">*</span></label>
                        {roles?.length > 0 ? (
                            <select
                                value={data.admin_role_id}
                                onChange={(e) => setData('admin_role_id', e.target.value)}
                                className="form-input"
                            >
                                <option value="">Select a custom role</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                                No custom roles available. Create one in Role Management first.
                            </div>
                        )}
                        {errors.admin_role_id && <p className="form-error">{errors.admin_role_id}</p>}
                    </div>

                    <div>
                        <label className="form-label">Status <span className="text-red-500">*</span></label>
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

                    <div className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm text-primary-800">
                        A secure temporary password will be generated automatically and emailed to the new team user.
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing || !roles?.length} className="btn btn-primary">
                        {processing ? 'Creating…' : 'Create Team User'}
                    </button>
                    <Link href="/admin/users" className="btn btn-secondary">Cancel</Link>
                </div>
            </form>
        </AdminLayout>
    );
}
