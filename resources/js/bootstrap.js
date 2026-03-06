import axios from 'axios';
window.axios = axios;

// CSRF: send token on every request so Laravel VerifyCsrfToken accepts POST/PUT/DELETE
const csrfMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfMeta) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfMeta.getAttribute('content');
}

// So Laravel and Shopify middleware treat requests as API: use Bearer token (session token)
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Ngrok bypass; ensure session token is sent for /shopify so VerifyShopify accepts the request
window.axios.interceptors.request.use((config) => {
    config.headers['ngrok-skip-browser-warning'] = 'true';
    if (config.url && config.url.includes('/shopify') && window.sessionToken) {
        config.headers['Authorization'] = `Bearer ${window.sessionToken}`;
    }
    return config;
});
