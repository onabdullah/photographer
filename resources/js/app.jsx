import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { Component } from 'react';
import { GlobalToastProvider, TOAST_EVENT_ERROR } from '@/Components/GlobalToast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Permanent CSRF fix: Inertia does not send the token by default. We inject it once per non-GET
// request. Single cached DOM read at load; no work on GET; one token merge per mutation — negligible cost.
const csrfMeta = typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]') : null;
router.on('before', (event) => {
    const method = (event.detail?.visit?.method || 'get').toLowerCase();
    if (method === 'get') return;
    const token = csrfMeta?.getAttribute('content');
    if (!token) return;
    const data = event.detail.visit.data;
    if (data instanceof FormData) {
        data.append('_token', token);
    } else {
        event.detail.visit.data = { ...(data || {}), _token: token };
    }
});

// When a visit fails, show toast and stay on current page (no blank full reload)
const showErrorToast = (event) => {
    const msg = event.detail?.message ?? event.detail?.error ?? 'Something went wrong. Please try again.';
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TOAST_EVENT_ERROR, { detail: { message: msg } }));
    }
};
router.on('error', showErrorToast);
router.on('exception', showErrorToast);

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
