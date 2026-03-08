import ApplicationLogo from '@/Components/ApplicationLogo';
import { FlashToaster } from '@/Components/GlobalToast';
import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function GuestLayout({ children }) {
    const { branding } = usePage().props;
    const appName = branding?.app_name || 'PhotoAdmin';
    const appLogoUrl = branding?.app_logo_url;
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const stored = typeof window !== 'undefined' && localStorage.getItem('theme');
        const systemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved = stored === 'dark' || stored === 'light' ? stored : (systemDark ? 'dark' : 'light');
        setTheme(resolved);
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', resolved === 'dark');
        }
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('theme', next);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
            <FlashToaster />
            <button
                type="button"
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-20 flex items-center justify-center w-10 h-10 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {theme === 'dark' ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
            </button>

            <Link
                href="/"
                className="relative z-10 flex flex-col items-center gap-2 mb-8 no-underline group"
                aria-label="Home"
            >
                {appLogoUrl ? (
                    <img src={appLogoUrl} alt="" className="h-14 w-14 object-contain transition-opacity group-hover:opacity-90" />
                ) : (
                    <ApplicationLogo className="h-14 w-14 text-primary-600 dark:text-primary-400 transition-colors group-hover:text-primary-700 dark:group-hover:text-primary-300" />
                )}
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
                    {appName}
                </span>
            </Link>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200/80 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        {children}
                    </div>
                </div>
                <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
                    &copy; {new Date().getFullYear()} {appName}. Built for Shopify.
                </p>
            </div>
        </div>
    );
}
