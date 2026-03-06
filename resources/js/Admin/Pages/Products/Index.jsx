import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Package } from 'lucide-react';

export default function ProductsIndex() {
    return (
        <AdminLayout
            title="Products"
            subtitle="All products across connected merchants"
            breadcrumbs={[{ label: 'Management' }, { label: 'Products' }]}
        >
            <div className="card flex flex-col items-center justify-center py-20 text-center">
                <Package size={40} className="mb-4 text-gray-300 dark:text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    Products coming soon
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    View and manage all products across your merchants here.
                    This page is under active development.
                </p>
            </div>
        </AdminLayout>
    );
}
