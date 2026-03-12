import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

/**
 * Shopify App Bridge Session Token Manager
 * 
 * This component initializes Shopify App Bridge and continuously refreshes
 * the session token, making it available to axios interceptors.
 */
export default function ShopifyProvider({ children }) {
    const { props } = usePage();
    
    useEffect(() => {
        // Only run in Shopify embedded context
        if (typeof window === 'undefined') {
            return;
        }

        let isMounted = true;
        let intervalId = null;

        async function initializeAppBridge() {
            try {
                const apiKey = document.querySelector('meta[name="shopify-api-key"]')?.content;
                const host = new URLSearchParams(window.location.search).get('host');
                
                if (!apiKey) {
                    console.warn('[Shopify] API key not found in meta tag');
                    return;
                }

                // Wait for App Bridge to be loaded from CDN
                let attempts = 0;
                while (!window.shopify && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }

                if (!window.shopify) {
                    console.error('[Shopify] App Bridge not loaded after waiting');
                    return;
                }

                console.log('[Shopify] App Bridge available, initializing...');

                // Function to get and store session token
                async function refreshSessionToken() {
                    if (!isMounted) return;
                    
                    try {
                        // Access the app instance - it should be auto-initialized by the token_handler partial
                        if (window.app && typeof window.app.idToken === 'function') {
                            const token = await window.app.idToken();
                            
                            if (token && isMounted) {
                                window.sessionToken = token;
                                console.log('[Shopify] Session token refreshed successfully');
                            }
                        } else {
                            console.warn('[Shopify] App instance not available or idToken method missing');
                        }
                    } catch (error) {
                        console.error('[Shopify] Failed to get session token:', error);
                    }
                }

                // Initial token fetch
                await refreshSessionToken();

                // Refresh token every 30 seconds (Shopify tokens expire after 1 minute)
                intervalId = setInterval(refreshSessionToken, 30000);

            } catch (error) {
                console.error('[Shopify] App Bridge initialization failed:', error);
            }
        }

        initializeAppBridge();

        return () => {
            isMounted = false;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

    return <>{children}</>;
}
