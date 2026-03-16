import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'react';
                    if (id.includes('node_modules/@inertiajs/')) return 'inertia';
                    if (id.includes('node_modules/lucide-react/')) return 'lucide';
                    if (id.includes('node_modules/@radix-ui/')) return 'radix';
                    if (id.includes('node_modules/apexcharts/') || id.includes('node_modules/react-apexcharts/')) return 'apexcharts';
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
});
