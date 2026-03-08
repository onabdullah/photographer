import axios from 'axios';
window.axios = axios;

// CSRF: read the XSRF-TOKEN cookie dynamically on every mutating request.
// The cookie is always kept current by Laravel (updated on every response),
// whereas the <meta name="csrf-token"> tag is only set on initial full-page load
// and goes stale after login/logout session regeneration in a SPA.
// Laravel's VerifyCsrfToken middleware accepts X-XSRF-TOKEN (cookie-based) as well as X-CSRF-TOKEN.
function getCsrfCookie() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

// So Laravel and Shopify middleware treat requests as API / use Bearer token (session token)
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

axios.interceptors.request.use((config) => {
    // Inject fresh CSRF token on every mutating request (cookie is always current)
    const method = (config.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && method !== 'options') {
        const token = getCsrfCookie();
        if (token) {
            config.headers['X-XSRF-TOKEN'] = token;
        }
    }
    // Ngrok: bypass browser warning header + inject Shopify session token when needed
    config.headers['ngrok-skip-browser-warning'] = 'true';
    if (config.url && config.url.includes('/shopify') && window.sessionToken) {
        config.headers['Authorization'] = `Bearer ${window.sessionToken}`;
    }
    return config;
});
