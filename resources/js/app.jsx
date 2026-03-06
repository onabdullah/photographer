import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

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

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
