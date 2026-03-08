import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
            <div className="absolute inset-0 overflow-hidden pointer-events-none aria-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-secondary-200/20 dark:bg-secondary-900/10 blur-3xl" />
            </div>

            <Link
                href="/"
                className="relative z-10 flex flex-col items-center gap-2 mb-8 no-underline group"
                aria-label="Home"
            >
                <ApplicationLogo className="h-14 w-14 text-primary-600 dark:text-primary-400 transition-colors group-hover:text-primary-700 dark:group-hover:text-primary-300" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    PhotoAdmin
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200/80 dark:border-gray-700 overflow-hidden">
                    <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-secondary-500" aria-hidden />
                    <div className="p-6 sm:p-8">
                        {children}
                    </div>
                </div>
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} PhotoAdmin. Built for Shopify.
                </p>
            </div>
        </div>
    );
}
