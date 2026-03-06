import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { router, usePage } from '@inertiajs/react';

export default function Settings() {
    const { flash } = usePage().props;

    const createStorageLink = () => {
        router.post('/admin/settings/storage-link', {}, {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">System Settings</h1>

                {flash?.success && (
                    <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Storage</h2>
                        <p className="text-gray-500 mb-4">
                            Create a symbolic link from <code className="text-sm bg-gray-100 px-1 rounded">public/storage</code> to{' '}
                            <code className="text-sm bg-gray-100 px-1 rounded">storage/app/public</code> so uploaded files can be served.
                        </p>
                        <button
                            type="button"
                            onClick={createStorageLink}
                            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Create Storage Link
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-500">Global system configuration.</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
