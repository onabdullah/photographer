import { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import * as Toast from '@radix-ui/react-toast';
import { X } from 'lucide-react';

const toastId = () => `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const AdminToastContext = createContext(null);

export function useAdminToast() {
    const ctx = useContext(AdminToastContext);
    if (!ctx) return { success: () => {}, error: () => {} };
    return ctx;
}

/**
 * Admin Radix Toast: bottom-right viewport, shows flash messages and supports imperative API.
 * Wrap admin layout with this and pass flash from usePage().props.
 */
export function AdminToastProvider({ flash, children }) {
    const [toasts, setToasts] = useState([]);
    const lastFlashRef = useRef({ success: null, error: null });

    const addToast = useCallback((type, message) => {
        const id = toastId();
        setToasts((prev) => [...prev, { id, type, message, open: true }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toastApi = useMemo(
        () => ({
            success: (msg) => addToast('success', msg),
            error: (msg) => addToast('error', msg),
        }),
        [addToast]
    );

    // Flash from redirects (success/error)
    useEffect(() => {
        const success = typeof flash?.success === 'function' ? flash.success() : flash?.success;
        const error = typeof flash?.error === 'function' ? flash.error() : flash?.error;
        if (success && success !== lastFlashRef.current.success) {
            addToast('success', success);
            lastFlashRef.current.success = success;
            lastFlashRef.current.error = null;
        }
        if (error && error !== lastFlashRef.current.error) {
            addToast('error', error);
            lastFlashRef.current.error = error;
            lastFlashRef.current.success = null;
        }
        if (!success && !error) lastFlashRef.current = { success: null, error: null };
    }, [flash, addToast]);

    return (
        <AdminToastContext.Provider value={toastApi}>
            <Toast.Provider duration={5000} label="Notification">
                {children}
                <Toast.Viewport
                    className="admin-toast-viewport"
                    label="Notifications (F8)"
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
                        <Toast.Close
                            className="admin-toast-close"
                            aria-label="Close"
                        >
                            <X size={12} strokeWidth={2} aria-hidden />
                        </Toast.Close>
                    </Toast.Root>
                ))}
            </Toast.Provider>
        </AdminToastContext.Provider>
    );
}

