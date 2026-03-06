import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Menu,
    X,
    Home,
    Package,
    Users,
    Settings,
    BarChart3,
    Image as ImageIcon,
    ChevronDown,
    LogOut,
} from 'lucide-react';

/**
 * AdminLayout - Main layout for internal admin panel
 * 
 * Provides responsive sidebar navigation with Tailwind CSS styling.
 * Includes mobile menu support and active route highlighting.
 * 
 * Location: resources/js/Admin/Layouts/AdminLayout.jsx
 * Used by: All pages in resources/js/Admin/Pages/
 */
export default function AdminLayout({ children }) {
    const { url, props } = usePage();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'Merchants', href: '/admin/merchants', icon: Users },
        { name: 'Products', href: '/admin/products', icon: Package },
        { name: 'AI Processing', href: '/admin/ai-processing', icon: ImageIcon },
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
    ];

    const isActive = (href) => url.startsWith(href);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar for mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                    <h1 className="text-xl font-bold text-gray-900">
                        Admin Panel
                    </h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="mt-8 px-4">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`mb-1 flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive(item.href)
                                        ? 'bg-indigo-50 text-indigo-600'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
                    <div className="flex h-16 items-center border-b border-gray-200 px-6">
                        <h1 className="text-xl font-bold text-gray-900">
                            Admin Panel
                        </h1>
                    </div>
                    <nav className="flex-1 space-y-1 px-4 py-8">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive(item.href)
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User section at bottom */}
                    <div className="border-t border-gray-200 p-4">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="flex w-full items-center rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:px-8">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    {/* User menu */}
                    <div className="ml-auto flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">
                                    {props.auth?.user?.name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                            <span className="hidden text-sm font-medium text-gray-700 md:block">
                                {props.auth?.user?.name || 'Admin'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
