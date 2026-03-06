import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { router, usePage } from '@inertiajs/react';
import { HardDrive, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
    const { flash } = usePage().props;

    const createStorageLink = () => {
        router.post('/admin/settings/storage-link', {}, { preserveScroll: true });
    };

    return (
        <AdminLayout
            title="System Settings"
            subtitle="Global configuration and server tools"
            breadcrumbs={[{ label: 'System' }, { label: 'Settings' }]}
        >
            <div className="max-w-3xl space-y-6">

                {/* Flash messages */}
                {flash?.success && (
                    <div className="rounded-xl p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800" role="alert">
                        <p className="text-sm text-green-800 dark:text-green-300">{flash.success}</p>
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" role="alert">
                        <p className="text-sm text-red-800 dark:text-red-300">{flash.error}</p>
                    </div>
                )}

                {/* Storage section */}
                <div className="card">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                            <HardDrive size={20} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Storage
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Create a symbolic link from{' '}
                                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                    public/storage
                                </code>{' '}
                                to{' '}
                                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded">
                                    storage/app/public
                                </code>{' '}
                                so uploaded files are publicly accessible.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={createStorageLink}
                        className="btn btn-primary"
                    >
                        Create Storage Link
                    </button>
                </div>

                {/* Placeholder for future settings */}
                <div className="card">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                            <SettingsIcon size={20} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Global Configuration
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Additional system-wide settings will appear here.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
