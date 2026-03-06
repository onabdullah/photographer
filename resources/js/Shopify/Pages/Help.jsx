import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Badge,
  Button,
  Collapsible,
  CalloutCard,
  List,
  Box,
} from '@shopify/polaris';
import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, AlertCircle, Image as ImageIcon } from 'lucide-react';

const SUPPORT_ILLUSTRATION = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80';

export default function Support({ shopName }) {
  const [openGuide, setOpenGuide] = useState(null);

  const toggleGuide = (id) => setOpenGuide(openGuide === id ? null : id);

  const guides = [
    {
      id: 'lighting',
      title: 'How to light your original photos for the best AI results',
      icon: ImageIcon,
      content: 'Soft, diffused lighting works best. Avoid harsh shadows or direct flash, as the AI tries to preserve the original lighting direction. Natural window light is often sufficient.',
    },
    {
      id: 'background',
      title: 'The anatomy of a perfect background prompt',
      icon: BookOpen,
      content: 'Be specific but concise. Instead of "table", try "rustic wooden table with morning sunlight". Mentioning textures (marble, silk, wood) helps the AI separate the object from the scene.',
    },
    {
      id: 'distortion',
      title: 'Troubleshooting: Why did the AI distort my product?',
      icon: AlertCircle,
      content: 'Distortion often happens when the product edges are blurry in the original photo, or if the product has complex transparency (like clear glass). Ensure the product is in sharp focus against a simple background.',
    },
  ];

  return (
    <ShopifyLayout>
      <Page
        title="Help & Support"
        subtitle="Everything you need to create stunning product imagery."
        titleMetadata={
          <Badge tone="success">All systems operational</Badge>
        }
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="600">
              {/* Hero section */}
              <Card>
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(70, 138, 154, 0.06) 0%, rgba(255, 122, 48, 0.06) 100%)',
                    borderRadius: 16,
                    overflow: 'hidden',
                  }}
                >
                  <InlineGrid columns={{ xs: 1, md: 2 }} gap="0">
                    <Box padding="800">
                      <BlockStack gap="400">
                        <Text variant="headingXl" as="h2" fontWeight="bold">
                          AI Prompting Masterclass
                        </Text>
                        <Text variant="bodyLg" tone="subdued">
                          Learn how to guide our AI engine to get pixel-perfect results every time.
                        </Text>
                      </BlockStack>
                    </Box>
                    <div
                      style={{
                        height: 200,
                        backgroundImage: `url(${SUPPORT_ILLUSTRATION})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                  </InlineGrid>
                </div>
              </Card>

              {/* Guides accordion */}
              <Card>
                <BlockStack gap="0">
                  {guides.map((guide, index) => {
                    const IconComponent = guide.icon;
                    return (
                      <div
                        key={guide.id}
                        style={{
                          borderTop: index > 0 ? '1px solid var(--p-color-border)' : 'none',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleGuide(guide.id)}
                          style={{
                            width: '100%',
                            cursor: 'pointer',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'transparent',
                            border: 'none',
                            textAlign: 'left',
                          }}
                          aria-expanded={openGuide === guide.id}
                          aria-controls={guide.id}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ color: 'var(--premium-teal)' }}>
                              <IconComponent size={20} />
                            </div>
                            <Text variant="bodyMd" fontWeight="semibold">
                              {guide.title}
                            </Text>
                          </div>
                          {openGuide === guide.id ? (
                            <ChevronUp size={20} style={{ color: 'var(--p-color-text-subdued)' }} />
                          ) : (
                            <ChevronDown size={20} style={{ color: 'var(--p-color-text-subdued)' }} />
                          )}
                        </button>
                        <Collapsible open={openGuide === guide.id} id={guide.id}>
                          <Box paddingBlockEnd="400" paddingInlineStart="800">
                            <Text variant="bodyMd" tone="subdued">
                              {guide.content}
                            </Text>
                          </Box>
                        </Collapsible>
                      </div>
                    );
                  })}
                </BlockStack>
              </Card>

              {/* FAQ cards */}
              <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Billing & Credits
                    </Text>
                    <List type="bullet">
                      <List.Item>Upgrades are pro-rated automatically</List.Item>
                      <List.Item>Credits reset on the 1st of every billing cycle</List.Item>
                      <List.Item>Unused credits do not roll over to the next month</List.Item>
                    </List>
                  </BlockStack>
                </Card>
                <Card>
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Privacy & Data
                    </Text>
                    <List type="bullet">
                      <List.Item>Your original images are encrypted at rest</List.Item>
                      <List.Item>We do not use your data to train public models</List.Item>
                      <List.Item>Request a full data export at any time</List.Item>
                    </List>
                  </BlockStack>
                </Card>
              </InlineGrid>

              {/* Priority support */}
              <div className="priority-ticket-callout">
                <CalloutCard
                  title="Priority developer support"
                  illustration="https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&q=80"
                  primaryAction={{
                    content: 'Open priority ticket',
                    url: `mailto:support@example.com?subject=Priority Support – ${shopName}`,
                    variant: 'primary',
                  }}
                >
                  <p>Can't find what you need? Skip the bots. Open a ticket directly with our engineering team.</p>
                </CalloutCard>
              </div>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>
    </ShopifyLayout>
  );
}
