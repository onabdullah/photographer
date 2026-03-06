import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import { Page, Layout, Card, Text, BlockStack, InlineGrid, Button, InlineStack, Box, Icon } from '@shopify/polaris';
import { ImageIcon } from '@shopify/polaris-icons';
import { router } from '@inertiajs/react';
import {
  Wand2,
  HelpCircle,
  Sparkles,
  ImageMinus,
  Layers,
  Maximize2,
  Eraser,
  Sun,
  ArrowRight,
} from 'lucide-react';
import MagicButton from '@/Shopify/Components/MagicButton';
import { useState, useEffect } from 'react';
import axios from 'axios';

const HERO_ILLUSTRATION = 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80';

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const s = Math.floor((now - date) / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

export default function Dashboard({ shopName, credits, totalGenerated, totalProducts: initialProducts, activePlan, recentGenerations = [] }) {
  const [totalProducts, setTotalProducts] = useState(initialProducts);

  useEffect(() => {
    if (initialProducts === 0 && window.axios) {
      axios.get('/shopify/api/products-count')
        .then(({ data }) => data.count >= 0 && setTotalProducts(data.count))
        .catch(() => { });
    }
  }, [initialProducts]);

  return (
    <ShopifyLayout>
      <Page
        title={`Welcome, ${shopName}`}
        subtitle="We'll help you grow your business. Our AI photographer works for you — professional product photos, on demand."
        titleMetadata={credits < 5 ? (
          <Box paddingInlineStart="200">
            <Text variant="bodySm" tone="critical" fontWeight="semibold">
              Low credits — upgrade to continue
            </Text>
          </Box>
        ) : null}
      >
        <BlockStack gap="700">
          {/* Hero section */}
          <Card>
            <div
              className="premium-card"
              style={{
                background: 'linear-gradient(135deg, rgba(70, 138, 154, 0.04) 0%, rgba(255, 122, 48, 0.04) 100%)',
                borderRadius: 16,
                overflow: 'hidden',
              }}
            >
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="0">
                <Box padding="800">
                  <BlockStack gap="400">
                    <Box
                      padding="300"
                      background="bg-surface-secondary"
                      borderRadius="300"
                      minWidth="fit-content"
                    >
                      <Sparkles size={24} className="text-brand-teal" style={{ color: 'var(--premium-teal)' }} />
                    </Box>
                    <Text variant="heading2Xl" as="h2" fontWeight="bold">
                      Let's grow your business together
                    </Text>
                    <Text variant="bodyLg" tone="subdued">
                      Our AI photographer works for you — create stunning product photos that sell. No shoots, no hassle. We're here to help you succeed.
                    </Text>
                    <Box paddingBlockStart="200">
                      <MagicButton size="large" onClick={() => router.visit('/shopify/ai-studio')}>
                        Launch AI Studio →
                      </MagicButton>
                    </Box>
                  </BlockStack>
                </Box>
                <Box>
                  <div
                    style={{
                      width: '100%',
                      height: 280,
                      backgroundImage: `url(${HERO_ILLUSTRATION})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                </Box>
              </InlineGrid>
            </div>
          </Card>

          {/* Metrics grid */}
          <Box paddingBlockStart="600">
            <h2 className="dashboard-section-heading">Overview</h2>
            <Box paddingBlockStart="200">
              <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
                <Card>
                  <div className="premium-card" style={{ padding: 'var(--space-lg)', transition: 'all 0.2s ease' }}>
                    <BlockStack gap="200">
                      <Text variant="bodySm" tone="subdued" fontWeight="medium">
                        Credits
                      </Text>
                      <Text
                        variant="heading2Xl"
                        as="p"
                        tone={credits < 5 ? 'critical' : undefined}
                        fontWeight="bold"
                        className="font-heading overview-count"
                      >
                        {credits}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        Remaining this month
                      </Text>
                    </BlockStack>
                  </div>
                </Card>
                <Card>
                  <div className="premium-card" style={{ padding: 'var(--space-lg)' }}>
                    <BlockStack gap="200">
                      <Text variant="bodySm" tone="subdued" fontWeight="medium">
                        Generated
                      </Text>
                      <Text variant="heading2Xl" as="p" fontWeight="bold" className="font-heading overview-count">
                        {totalGenerated}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        Total images created
                      </Text>
                    </BlockStack>
                  </div>
                </Card>
                <Card>
                  <div className="premium-card" style={{ padding: 'var(--space-lg)' }}>
                    <BlockStack gap="200">
                      <Text variant="bodySm" tone="subdued" fontWeight="medium">
                        Products
                      </Text>
                      <Text variant="heading2Xl" as="p" fontWeight="bold" className="font-heading overview-count">
                        {totalProducts}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        Active in your store
                      </Text>
                    </BlockStack>
                  </div>
                </Card>
                <Card>
                  <div className="premium-card" style={{ padding: 'var(--space-lg)' }}>
                    <BlockStack gap="200">
                      <Text variant="bodySm" tone="subdued" fontWeight="medium">
                        Plan
                      </Text>
                      <Text variant="headingMd" as="p" fontWeight="bold" className="overview-plan-value">
                        {activePlan}
                      </Text>
                      <Button size="slim" variant="primary" onClick={() => router.visit('/shopify/plans')} className="overview-manage-btn">
                        Manage
                      </Button>
                    </BlockStack>
                  </div>
                </Card>
              </InlineGrid>
            </Box>
          </Box>

          {/* All tools – hero section */}
          <Box paddingBlockStart="800">
            <div className="dashboard-tools-section">
              <div className="dashboard-tools-header">
                <h2 className="dashboard-tools-heading">All Tools</h2>
                <Text variant="bodyMd" tone="subdued" as="p" className="dashboard-tools-subtitle">
                  Professional AI tools to edit, enhance, and optimize your product photos. Click any tool to open it in AI Studio.
                </Text>
              </div>
              <div className="dashboard-tools-grid">
                {[
                  { name: 'Background Remover', desc: 'Clean your image background', value: 'remove_bg', Icon: ImageMinus },
                  { name: 'Background Swap', desc: 'Change product scenes', value: 'bg_swap', Icon: Layers },
                  { name: 'Upscaler', desc: 'Increase resolution 4×', value: 'upscale', Icon: Maximize2 },
                  { name: 'Magic Eraser', desc: 'Remove unwanted objects', value: 'magic_eraser', Icon: Eraser },
                  { name: 'Image Enhancer', desc: 'Boost clarity & detail', value: 'enhance', Icon: Sparkles },
                  { name: 'Lighting Fix', desc: 'Adjust exposure & balance', value: 'lighting', Icon: Sun },
                ].map(({ name, desc, value, Icon }) => (
                  <Card key={name}>
                    <button
                      type="button"
                      className="dashboard-tool-card"
                      onClick={() => router.visit(`/shopify/ai-studio?tool=${value}`)}
                      aria-label={`${name}: ${desc}. Open in AI Studio.`}
                      title={`${name}: ${desc}`}
                    >
                      <span className="dashboard-tool-icon">
                        <Icon size={22} strokeWidth={1.75} aria-hidden />
                      </span>
                      <span className="dashboard-tool-content">
                        <Text variant="bodyMd" fontWeight="semibold" as="span" className="dashboard-tool-name">
                          {name}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="span" className="dashboard-tool-desc">
                          {desc}
                        </Text>
                      </span>
                      <span className="dashboard-tool-arrow" aria-hidden>
                        <ArrowRight size={18} strokeWidth={2} />
                      </span>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          </Box>

          {/* Quick actions */}
          <Box paddingBlockStart="800">
            <h2 className="dashboard-section-heading">Quick Actions</h2>
            <Box paddingBlockStart="200">
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                <Card>
                  <div
                    className="premium-card"
                    style={{
                      padding: 'var(--space-lg)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.visit('/shopify/ai-studio')}
                    onKeyDown={(e) => e.key === 'Enter' && router.visit('/shopify/ai-studio')}
                    role="button"
                    tabIndex={0}
                  >
                    <BlockStack gap="400">
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        minWidth="fit-content"
                      >
                        <Wand2 size={22} style={{ color: 'var(--premium-teal)' }} />
                      </Box>
                      <BlockStack gap="200">
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          AI Studio
                        </Text>
                        <Text variant="bodyMd" tone="subdued">
                          Our AI photographer is ready to help you create stunning photos for your store.
                        </Text>
                      </BlockStack>
                      <MagicButton fullWidth onClick={() => router.visit('/shopify/ai-studio')}>
                        Launch Studio →
                      </MagicButton>
                    </BlockStack>
                  </div>
                </Card>
                <Card>
                  <div
                    className="premium-card"
                    style={{
                      padding: 'var(--space-lg)',
                      cursor: 'pointer',
                    }}
                    onClick={() => router.visit('/shopify/help')}
                    onKeyDown={(e) => e.key === 'Enter' && router.visit('/shopify/help')}
                    role="button"
                    tabIndex={0}
                  >
                    <BlockStack gap="400">
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        minWidth="fit-content"
                      >
                        <HelpCircle size={22} style={{ color: 'var(--premium-teal)' }} />
                      </Box>
                      <BlockStack gap="200">
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Help & Tutorials
                        </Text>
                        <Text variant="bodyMd" tone="subdued">
                          We're here to help — learn tips and make the most of your credits.
                        </Text>
                      </BlockStack>
                      <Button fullWidth onClick={() => router.visit('/shopify/help')}>
                        Read Guides →
                      </Button>
                    </BlockStack>
                  </div>
                </Card>
              </InlineGrid>
            </Box>
          </Box>

          {/* Recent creations – AI Studio generations */}
          <Box paddingBlockStart="800" paddingBlockEnd="800">
            <div className="dashboard-recent-header">
              <h2 className="dashboard-section-heading">Recent Creations</h2>
              {recentGenerations.length > 0 && (
                <Button variant="plain" onClick={() => router.visit('/shopify/ai-studio')}>
                  View all in AI Studio
                  <span className="dashboard-recent-arrow" aria-hidden><ArrowRight size={18} strokeWidth={2} /></span>
                </Button>
              )}
            </div>
            <Box paddingBlockStart="200">
              <Card>
                {recentGenerations.length > 0 ? (
                  <div className="dashboard-recent-grid">
                    {(() => {
                      const list = recentGenerations.slice(0, 7);
                      list.push({ id: 'create-more', _placeholder: true });
                      return list.map((item) =>
                        item._placeholder ? (
                          <div key="create-more" className="dashboard-recent-card dashboard-recent-card-create">
                            <button
                              type="button"
                              className="dashboard-recent-card-inner"
                              onClick={() => router.visit('/shopify/ai-studio')}
                              aria-label="Generate another image in AI Studio"
                            >
                              <span className="dashboard-recent-create-icon" aria-hidden>
                                <Sparkles size={24} strokeWidth={1.5} style={{ color: 'var(--premium-teal)' }} />
                              </span>
                              <Text as="span" variant="bodySm" tone="subdued">
                                Create another
                              </Text>
                              <span className="dashboard-recent-create-btn">Generate</span>
                            </button>
                          </div>
                        ) : (
                          <div key={item.id} className="dashboard-recent-card">
                            <button
                              type="button"
                              className="dashboard-recent-card-inner"
                              onClick={() => router.visit('/shopify/ai-studio')}
                              aria-label={`View creation from ${timeAgo(item.updated_at)} in AI Studio`}
                            >
                              <div className="dashboard-recent-checkerboard">
                                <img src={item.result_image_url} alt="" loading="lazy" />
                              </div>
                              <div className="dashboard-recent-meta">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  {timeAgo(item.updated_at)}
                                </Text>
                                {item.shopify_product_id && (
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    · On product
                                  </Text>
                                )}
                              </div>
                            </button>
                          </div>
                        )
                      );
                    })()}
                  </div>
                ) : (
                  <div className="dashboard-recent-empty">
                    <BlockStack gap="500">
                      <Box paddingBlockEnd="200">
                        <div className="dashboard-recent-empty-icon" aria-hidden>
                          <Icon source={ImageIcon} tone="base" />
                        </div>
                      </Box>
                      <BlockStack gap="200">
                        <Text variant="headingLg" as="h3" fontWeight="bold">
                          Your creations will appear here
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="p">
                          Use AI Studio to remove backgrounds, swap scenes, and enhance product photos. Everything you create shows up here.
                        </Text>
                      </BlockStack>
                      <Box paddingBlockStart="200">
                        <MagicButton size="large" onClick={() => router.visit('/shopify/ai-studio')}>
                          Open AI Studio
                        </MagicButton>
                      </Box>
                    </BlockStack>
                  </div>
                )}
              </Card>
            </Box>
          </Box>
        </BlockStack>
      </Page>
    </ShopifyLayout>
  );
}
