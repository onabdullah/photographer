import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { DollarSign } from 'lucide-react';

export default function Finance() {
    return (
        <AdminLayout
            title="Finance"
            breadcrumbs={[{ label: 'Finance' }]}
        >
            <div className="space-y-6">
                <div className="card">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                            <DollarSign size={20} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                Finance Overview
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Revenue, billing, and financial reports will appear here.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
