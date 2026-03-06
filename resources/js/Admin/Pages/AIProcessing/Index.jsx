import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Zap } from 'lucide-react';

export default function AIProcessingIndex() {
    return (
        <AdminLayout
            title="AI Processing"
            breadcrumbs={[{ label: 'AI Processing' }]}
        >
            <div className="card flex flex-col items-center justify-center py-20 text-center">
                <Zap size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    AI Jobs monitor
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Real-time AI processing queue, job status, retry controls,
                    and error logs will appear here.
                </p>
            </div>
        </AdminLayout>
    );
}
