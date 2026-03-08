/**
 * Admin panel toasts (Radix UI Toast), shown bottom-right.
 * Flash messages from redirects are shown automatically via AdminToastProvider.
 *
 * For imperative toasts from a component, use the hook:
 *   import { useAdminToast } from '@/Admin/Components/AdminToast';
 *   const toast = useAdminToast();
 *   toast.success('Saved');
 *   toast.error('Something went wrong');
 */
export { useAdminToast } from '@/Admin/Components/AdminToast';
