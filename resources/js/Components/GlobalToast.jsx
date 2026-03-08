import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { usePage } from '@inertiajs/react';
import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

const toastId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const GlobalToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(GlobalToastContext);
    return ctx || { success: () => {}, error: () => {} };
}

/** Event names for triggering toasts from outside React (e.g. router). */
export const TOAST_EVENT_ERROR = 'app:toast:error';
export const TOAST_EVENT_SUCCESS = 'app:toast:success';

/**
 * Global toast: listens for app:toast:error / app:toast:success (and flash via FlashToaster in layouts).
 * Wrap the app once in app.jsx. Use useToast() or dispatch CustomEvent(TOAST_EVENT_ERROR, { detail: { message } }).
 */
export function GlobalToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message) => {
        if (!message || String(message).trim() === '') return;
        const id = toastId();
        setToasts((prev) => [...prev, { id, type, message: String(message).trim(), open: true }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const api = useMemo(
        () => ({ success: (msg) => addToast('success', msg), error: (msg) => addToast('error', msg) }),
        [addToast]
    );

    // Custom events (router errors, FlashToaster, Login errors, etc.)
    useEffect(() => {
        const onError = (e) => addToast('error', e.detail?.message || 'Something went wrong.');
        const onSuccess = (e) => addToast('success', e.detail?.message || 'Done.');
        window.addEventListener(TOAST_EVENT_ERROR, onError);
        window.addEventListener(TOAST_EVENT_SUCCESS, onSuccess);
        return () => {
            window.removeEventListener(TOAST_EVENT_ERROR, onError);
            window.removeEventListener(TOAST_EVENT_SUCCESS, onSuccess);
        };
    }, [addToast]);

    return (
        <GlobalToastContext.Provider value={api}>
            <Toast.Provider duration={5000} label="Notification">
                {children}
                <Toast.Viewport
                    className="admin-toast-viewport"
                    aria-label="Notifications"
                />
                {toasts.map((t) => (
                    <Toast.Root
                        key={t.id}
                        open={t.open}
                        onOpenChange={(open) => {
                            if (!open) removeToast(t.id);
                        }}
                        className={`admin-toast-root admin-toast-root--${t.type}`}
                    >
                        <Toast.Description className="admin-toast-description">
                            {t.message}
                        </Toast.Description>
                        <Toast.Close className="admin-toast-close" aria-label="Close">
                            <X size={12} strokeWidth={2} aria-hidden />
                        </Toast.Close>
                    </Toast.Root>
                ))}
            </Toast.Provider>
        </GlobalToastContext.Provider>
    );
}

/** Renders nothing; reads usePage().props.flash and dispatches toast events so global toaster shows them. Add once per layout (Admin, Guest). */
export function FlashToaster() {
    const { props } = usePage();
    const flash = props?.flash;
    const lastRef = useRef({ success: null, error: null });

    useEffect(() => {
        const success = typeof flash?.success === 'function' ? flash.success() : flash?.success;
        const error = typeof flash?.error === 'function' ? flash.error() : flash?.error;
        if (success && success !== lastRef.current.success) {
            lastRef.current.success = success;
            lastRef.current.error = null;
            window.dispatchEvent(new CustomEvent(TOAST_EVENT_SUCCESS, { detail: { message: success } }));
        }
        if (error && error !== lastRef.current.error) {
            lastRef.current.error = error;
            lastRef.current.success = null;
            window.dispatchEvent(new CustomEvent(TOAST_EVENT_ERROR, { detail: { message: error } }));
        }
        if (!success && !error) lastRef.current = { success: null, error: null };
    }, [flash]);

    return null;
}
