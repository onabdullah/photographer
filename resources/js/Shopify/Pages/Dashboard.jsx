import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import { Page, Layout, Card, Text, BlockStack, InlineGrid, Button, InlineStack, Box, Icon, Banner } from '@shopify/polaris';
import { ImageIcon, WandIcon, QuestionCircleIcon, MagicIcon, RemoveBackgroundIcon, MaximizeIcon, MinimizeIcon, SunIcon, ArrowRightIcon, ProductIcon } from '@shopify/polaris-icons';
import { TitleBar } from '@shopify/app-bridge-react';
import { router, usePage } from '@inertiajs/react';
import MagicButton from '@/Shopify/Components/MagicButton';
import { useState, useEffect } from 'react';
import axios from 'axios';

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

const ALL_TOOL_VALUES = ['magic_eraser', 'remove_bg', 'compressor', 'upscale', 'enhance', 'lighting'];

export default function Dashboard({
  shopName,
  ownerName,
  credits,
  totalGenerated,
  totalProducts: initialProducts,
  activePlan,
  recentGenerations = [],
  enabledTools,
  // CMS Settings
  heroTitle,
  heroSubtitle,
  heroImageUrl,
  featuredToolsEnabled,
  featuredTools,
  announcementEnabled,
  announcementText,
}) {
  const { props } = usePage();
  const showProductAILab = props.showProductAILab !== false;
  const enabled = Array.isArray(enabledTools) && enabledTools.length > 0 ? enabledTools : ALL_TOOL_VALUES;
  const welcomeName = ownerName || shopName;
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
      <TitleBar title="Dashboard" />
      <Page
        title={`Welcome, ${welcomeName}`}
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
          {/* Announcement Banner */}
          {announcementEnabled && announcementText && (
            <Banner tone="info">
              <Text variant="bodySm" as="p">{announcementText}</Text>
            </Banner>
          )}

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
                    <InlineStack gap="300" blockAlign="center" wrap={false}>
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="300"
                        minWidth="fit-content"
                      >
                        <div style={{ color: 'var(--premium-teal)' }}>
                          <Icon source={MagicIcon} tone="inherit" />
                        </div>
                      </Box>
                      <Text variant="heading2Xl" as="h2" fontWeight="bold">
                        {heroTitle}
                      </Text>
                    </InlineStack>
                    <Text variant="bodyLg" tone="subdued">
                      {heroSubtitle}
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
                      backgroundImage: `url(${heroImageUrl})`,
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
            <Text as="h2" className="dashboard-section-heading">Overview</Text>
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
                <Text as="h2" className="dashboard-tools-heading">All Tools</Text>
              </div>
              {showProductAILab && (
                <div className="dashboard-tools-vto-wrap">
                  <div className="dashboard-vto-card-border">
                    <div className="dashboard-vto-card-inner">
                      <Card>
                        <button
                          type="button"
                          className="dashboard-tool-card dashboard-tool-card-vto"
                          onClick={() => router.visit('/shopify/product-ai-lab')}
                          aria-label="Product AI Lab (VTO): Generate full product photos with AI. Open Product AI Lab."
                          title="Product AI Lab (VTO)"
                        >
                          <span className="dashboard-tool-icon dashboard-tool-icon-vto">
                            <Icon source={ProductIcon} />
                          </span>
                          <span className="dashboard-tool-content">
                            <Text variant="headingMd" fontWeight="bold" as="span" className="dashboard-tool-name">
                              Product AI Lab (VTO)
                            </Text>
                            <Text variant="bodyMd" tone="subdued" as="span" className="dashboard-tool-desc">
                              Turn any product into stunning lifestyle photos — virtual try-on, custom backgrounds, and scenes that sell. No studio needed.
                            </Text>
                          </span>
                          <span className="dashboard-tool-arrow" aria-hidden>
                            <Icon source={ArrowRightIcon} />
                          </span>
                        </button>
                      </Card>
                    </div>
                  </div>
                </div>
              )}
              <div className="dashboard-tools-grid">
                {[
                  { name: 'Magic Eraser', desc: 'Remove unwanted objects', value: 'magic_eraser', source: MagicIcon },
                  { name: 'Background Remover', desc: 'Clean your image background', value: 'remove_bg', source: RemoveBackgroundIcon },
                  { name: 'Image Compressor', desc: 'Reduce file size, keep quality', value: 'compressor', source: MinimizeIcon },
                  { name: 'Upscaler', desc: 'Increase resolution 4×', value: 'upscale', source: MaximizeIcon },
                  { name: 'Image Enhancer', desc: 'Boost clarity & detail', value: 'enhance', source: MagicIcon },
                  { name: 'Lighting Fix', desc: 'Adjust exposure & balance', value: 'lighting', source: SunIcon },
                ]
                  .filter((t) => enabled.includes(t.value))
                  .map(({ name, desc, value, source }) => (
                  <Card key={name}>
                    <button
                      type="button"
                      className="dashboard-tool-card"
                      onClick={() => router.visit(`/shopify/ai-studio?tool=${value}`)}
                      aria-label={`${name}: ${desc}. Open in AI Studio.`}
                      title={`${name}: ${desc}`}
                    >
                      <span className="dashboard-tool-icon">
                        <Icon source={source} />
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
                        <Icon source={ArrowRightIcon} />
                      </span>
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          </Box>

          {/* Quick actions */}
          <Box paddingBlockStart="800">
            <Text as="h2" className="dashboard-section-heading">Quick Actions</Text>
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
                  >
                    <BlockStack gap="400">
                      <BlockStack gap="200">
                        <InlineStack gap="300" blockAlign="center" wrap={false}>
                          <Box
                            padding="300"
                            background="bg-surface-secondary"
                            borderRadius="300"
                            minWidth="fit-content"
                          >
                            <div style={{ color: 'var(--premium-teal)' }}>
                              <Icon source={WandIcon} tone="inherit" />
                            </div>
                          </Box>
                          <Text variant="headingMd" as="h3" fontWeight="semibold">
                            AI Studio
                          </Text>
                        </InlineStack>
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
                  >
                    <BlockStack gap="400">
                      <BlockStack gap="200">
                        <InlineStack gap="300" blockAlign="center" wrap={false}>
                          <Box
                            padding="300"
                            background="bg-surface-secondary"
                            borderRadius="300"
                            minWidth="fit-content"
                          >
                            <div style={{ color: 'var(--premium-teal)' }}>
                              <Icon source={QuestionCircleIcon} tone="inherit" />
                            </div>
                          </Box>
                          <Text variant="headingMd" as="h3" fontWeight="semibold">
                            Help & Tutorials
                          </Text>
                        </InlineStack>
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
              <Text as="h2" className="dashboard-section-heading">Recent Creations</Text>
              {recentGenerations.length > 0 && (
                <Button variant="plain" onClick={() => router.visit('/shopify/ai-studio')}>
                  View all in AI Studio
                <div className="dashboard-recent-arrow" aria-hidden><Icon source={ArrowRightIcon} /></div>
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
                                <div style={{ color: 'var(--premium-teal)' }}>
                                  <Icon source={MagicIcon} tone="inherit" />
                                </div>
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
                                <img src={item.result_image_url} alt={`AI-generated creation from ${timeAgo(item.updated_at)}`} loading="lazy" />
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
                          Use AI Studio to remove backgrounds and enhance product photos. Everything you create shows up here.
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
