<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        {{-- Dark mode + sidebar init — must be the FIRST script in head to prevent FOUC --}}
        <script>
            (function () {
                var stored = localStorage.getItem('theme');
                var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var theme = (stored === 'dark' || stored === 'light') ? stored : (systemDark ? 'dark' : 'light');
                if (theme === 'dark') document.documentElement.classList.add('dark');
                var sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
                document.documentElement.setAttribute('data-sidebar', sidebarCollapsed ? 'collapsed' : 'expanded');
            })();
        </script>

        {{-- Admin panel is a separate web dashboard (not embedded). Load Shopify App Bridge only for embedded app routes. --}}
        @if(request()->is('shopify*'))
        <meta name="shopify-api-key" content="{{ config('shopify-app.api_key') }}" />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        @include('shopify-app::partials.token_handler')
        @endif

        {{-- Manrope + Patrick Hand (admin) + Inter/Plus Jakarta Sans (Shopify app) --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Patrick+Hand&display=swap" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600&family=plus-jakarta-sans:500,600,700&display=swap" rel="stylesheet">

        {{-- Google Material Icons (for admin icon usage) --}}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
