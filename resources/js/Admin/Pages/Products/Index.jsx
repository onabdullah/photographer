import AdminLayout from '@/Admin/Layouts/AdminLayout';

export default function ProductsIndex() {
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">All Products</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500">View all products across merchants.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
