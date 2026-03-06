import AdminLayout from '@/Admin/Layouts/AdminLayout';

export default function AIProcessingIndex() {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">AI Processing Jobs</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">Monitor all AI processing jobs.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
