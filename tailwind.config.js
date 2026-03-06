import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                'brand-teal': '#468A9A',
                'brand-orange': '#FF7A30',
            },
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                heading: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
            },
            boxShadow: {
                'premium-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
                'premium-md': '0 4px 12px rgba(0, 0, 0, 0.05)',
                'premium-lg': '0 8px 24px rgba(0, 0, 0, 0.06)',
            },
            transitionDuration: {
                150: '150ms',
                200: '200ms',
                250: '250ms',
            },
        },
    },

    plugins: [forms],
};
