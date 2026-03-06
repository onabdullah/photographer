import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
    return (
        <AdminLayout
            title="Analytics"
            subtitle="Platform-wide reporting and insights"
            breadcrumbs={[{ label: 'Reports' }, { label: 'Analytics' }]}
        >
            <div className="card flex flex-col items-center justify-center py-20 text-center">
                <BarChart3 size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    Analytics dashboard
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Revenue charts, merchant growth, AI usage trends, and
                    export tools will be available here.
                </p>
            </div>
        </AdminLayout>
    );
}
