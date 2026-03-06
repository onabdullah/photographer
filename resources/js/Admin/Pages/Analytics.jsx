import AdminLayout from '@/Admin/Layouts/AdminLayout';

export default function Analytics() {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Analytics</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">Platform-wide analytics and reporting.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
