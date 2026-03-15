import { AppProvider } from '@shopify/polaris';
import { NavMenu } from '@shopify/app-bridge-react';
import { usePage, Link } from '@inertiajs/react';
import '@shopify/polaris/build/esm/styles.css';
import WelcomeModal from '@/Shopify/Components/WelcomeModal';
import ShopifyProvider from '@/Shopify/Components/ShopifyProvider';

/**
 * Premium Shopify Layout – Ultra-refined embedded app experience
 * Polaris + App Bridge. WCAG AA compliant.
 */
export default function ShopifyLayout({ children }) {
  const { props } = usePage();
  const showProductAILab = props.showProductAILab !== false;

  return (
    <ShopifyProvider>
      <AppProvider
        i18n={{
          Polaris: {
            ResourceList: {
              sortingLabel: 'Sort by',
              defaultItemSingular: 'item',
              defaultItemPlural: 'items',
              showing: 'Showing {itemsCount} {resource}',
              Item: {
                viewItem: 'View details for {itemName}',
              },
            },
            Common: {
              checkbox: 'checkbox',
            },
          },
        }}
      >
        <NavMenu>
          <Link href="/shopify" rel="home">Dashboard</Link>
          <Link href="/shopify/ai-studio">General AI Studio</Link>
          {showProductAILab && <Link href="/shopify/product-ai-lab">Product AI Lab (VTO)</Link>}
          <Link href="/shopify/plans">Plans & Billing</Link>
          <Link href="/shopify/settings">Settings</Link>
          <Link href="/shopify/support">Live Support</Link>
        </NavMenu>
        <div className="premium-page-enter" style={{ fontFamily: 'var(--font-body)' }}>
          {children}
          <WelcomeModal />
        </div>
      </AppProvider>
    </ShopifyProvider>
  );
}
