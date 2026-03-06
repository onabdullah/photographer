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

    darkMode: 'class',

    theme: {
        extend: {
            colors: {
                // Primary palette — teal action color (#468A9A base)
                primary: {
                    50:  '#f0f7f9',
                    100: '#d9ecf1',
                    200: '#b6dce7',
                    300: '#83c4d7',
                    400: '#55a9be',
                    500: '#468A9A',
                    600: '#3b7a8a',
                    700: '#316678',
                    800: '#265663',
                    900: '#1e4450',
                    950: '#132d36',
                },
                // Secondary palette — orange accent (#FF7A30 base)
                secondary: {
                    50:  '#fff7f0',
                    100: '#ffe8d4',
                    200: '#ffd1a9',
                    300: '#ffb37d',
                    400: '#ff9b5c',
                    500: '#FF7A30',
                    600: '#e66a25',
                    700: '#cc5e1e',
                    800: '#a64c18',
                    900: '#8a3e14',
                    950: '#52220a',
                },
                // Legacy aliases
                'brand-teal': '#468A9A',
                'brand-orange': '#FF7A30',
            },
            fontFamily: {
                sans: ['Manrope', 'Inter', ...defaultTheme.fontFamily.sans],
                heading: ['Manrope', 'Plus Jakarta Sans', ...defaultTheme.fontFamily.sans],
                brand: ['Patrick Hand', 'cursive'],
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
            keyframes: {
                'blink-slow': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.5' },
                },
            },
            animation: {
                'blink-slow': 'blink-slow 2.5s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
