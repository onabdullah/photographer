import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Component } from 'react';
import { GlobalToastProvider, TOAST_EVENT_ERROR } from '@/Components/GlobalToast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Inertia v2 sends X-XSRF-TOKEN from the cookie on every non-GET request automatically.
// No manual CSRF injection needed — that would require reading the meta tag which can be
// stale after logout (session invalidation regenerates the token without a full page reload).

// When a visit fails, show toast and stay on current page (no blank full reload)
const showErrorToast = (event) => {
    const msg = event.detail?.message ?? event.detail?.error ?? 'Something went wrong. Please try again.';
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TOAST_EVENT_ERROR, { detail: { message: msg } }));
    }
};
router.on('error', showErrorToast);
// Prevent Inertia replacing the page with a raw HTML response (like 403 Session Expired error screen).
router.on('invalid', (event) => {
    event.preventDefault();
    console.error("Inertia invalid HTML response received:", event.detail.response);
    showErrorToast({ detail: { message: "Your session may have expired or a server error occurred. Please refresh the page." } });
});
// Prevent Inertia replacing the page with a raw 500 HTML response (white screen).
// Show a toast instead and stay on the current page.
router.on('exception', (event) => {
    event.preventDefault();
    showErrorToast(event);
});

// App bridge token interceptor for Inertia requests
router.on('before', (event) => {
    const url = event.detail.visit.url;
    const pathname = (url instanceof URL) ? url.pathname : String(url);
    
    if (window.sessionToken && pathname.includes('/shopify')) {
        event.detail.visit.headers = event.detail.visit.headers || {};
        event.detail.visit.headers['Authorization'] = `Bearer ${window.sessionToken}`;
    }
});

// Root error boundary: if any page component throws, show message + refresh instead of white screen
class InertiaErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">Something went wrong.</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
                    >
                        Refresh page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        const pages = import.meta.glob([
            './Pages/**/*.jsx',
            './Shopify/Pages/**/*.jsx',
            './Admin/Pages/**/*.jsx',
        ]);

        let path = name;

        // Add /Pages/ to Shopify and Admin paths (only if not already present)
        if (name.startsWith('Shopify/')) {
            path = name.includes('Pages') ? name : name.replace('Shopify/', 'Shopify/Pages/');
        } else if (name.startsWith('Admin/')) {
            path = name.includes('Pages') ? name : name.replace('Admin/', 'Admin/Pages/');
        } else {
            // Regular pages - add Pages/ prefix
            path = `Pages/${name}`;
        }

        return resolvePageComponent(`./${path}.jsx`, pages);
    },

    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <InertiaErrorBoundary>
                <GlobalToastProvider>
                    <App {...props} />
                </GlobalToastProvider>
            </InertiaErrorBoundary>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
