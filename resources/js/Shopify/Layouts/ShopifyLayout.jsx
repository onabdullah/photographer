import { AppProvider } from '@shopify/polaris';
import { NavMenu } from '@shopify/app-bridge-react';
import { usePage } from '@inertiajs/react';
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
          <a href="/shopify" rel="home">Dashboard</a>
          <a href="/shopify/ai-studio">General AI Studio</a>
          {showProductAILab && <a href="/shopify/product-ai-lab">Product AI Lab (VTO)</a>}
          <a href="/shopify/plans">Plans & Billing</a>
          <a href="/shopify/settings">Settings</a>
          <a href="/shopify/help">Help & Support</a>
        </NavMenu>
        <div className="premium-page-enter" style={{ fontFamily: 'var(--font-body)' }}>
          {children}
          <WelcomeModal />
        </div>
      </AppProvider>
    </ShopifyProvider>
  );
}
