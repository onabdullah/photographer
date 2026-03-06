import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  InlineStack,
  Button,
  Badge,
  Box,
  ProgressBar,
} from '@shopify/polaris';
import { Camera, Zap, Clock, Check } from 'lucide-react';
import MagicButton from '@/Shopify/Components/MagicButton';

const TEAL = '#468A9A';

const CREDIT_PACKS = [
  { id: 'pack-100', credits: 100, price: '$5.99', perCredit: '6¢', popular: false },
  { id: 'pack-250', credits: 250, price: '$8.99', perCredit: '3.6¢', popular: true },
  { id: 'pack-500', credits: 500, price: '$16.99', perCredit: '3.4¢', popular: false },
  { id: 'pack-1000', credits: 1000, price: '$21.99', perCredit: '2.2¢', popular: false },
];

const FREE_FEATURES = [
  '5 AI generations to start',
  'All AI tools unlocked',
  'Export to your store',
];

const PRO_FEATURES = [
  '500 AI generations / month',
  'All AI tools unlocked',
  'Priority support',
  'Background remover & swap',
];

const SCALE_FEATURES = [
  '2,000 AI generations / month',
  'All AI tools unlocked',
  'Priority support',
  'Background remover & swap',
  'Dedicated success manager',
];

export default function Billing({ credits, currentPlan }) {
  const planName = currentPlan?.name ?? 'Free Trial';
  const creditsRemaining = typeof credits === 'number' ? credits : 0;
  const totalCreditsPerMonth = currentPlan?.credits_per_month ?? 5;
  const progress = totalCreditsPerMonth > 0 ? Math.min(1, creditsRemaining / totalCreditsPerMonth) : 0;

  const isFree = planName === 'Free Trial';
  const isPro = planName === 'Pro Plan' || planName === 'Pro';
  const isScale = planName === 'Scale';

  return (
    <ShopifyLayout>
      <Page
        title="Plans & Billing"
        subtitle="Manage your AI credits and choose the plan that fits your business scale."
      >
        <BlockStack gap="600">
          {/* 1. Current Account Status Banner */}
          <Card className="billing-status-card">
            <Box padding="400">
              <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                <BlockStack gap="200">
                  <InlineStack gap="200" blockAlign="center" wrap>
                    <Text variant="headingLg" as="h2" fontWeight="bold">
                      Current Plan: {planName}
                    </Text>
                    <Badge tone="success">Active</Badge>
                  </InlineStack>
                </BlockStack>
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Credits Remaining: {creditsRemaining} / {totalCreditsPerMonth}
                  </Text>
                  <div className="billing-progress-teal">
                    <ProgressBar progress={progress} size="medium" tone="primary" />
                  </div>
                </BlockStack>
              </InlineGrid>
            </Box>
          </Card>

          {/* 2. Monthly Subscriptions */}
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2" fontWeight="semibold">
              Monthly Subscriptions
            </Text>
            <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
              {/* Free Trial */}
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h3" fontWeight="bold">
                        Free Trial
                      </Text>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text variant="heading2Xl" as="span" fontWeight="bold">
                          $0
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="span">
                          /mo
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        5 Credits
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      {FREE_FEATURES.map((item) => (
                        <InlineStack key={item} gap="200" blockAlign="center">
                          <Check size={16} style={{ color: TEAL, flexShrink: 0 }} aria-hidden />
                          <Text as="span" variant="bodySm">{item}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                    {isFree ? (
                      <Button fullWidth disabled>Current Plan</Button>
                    ) : (
                      <Button fullWidth variant="tertiary" disabled>Free Trial</Button>
                    )}
                  </BlockStack>
                </Box>
              </Card>

              {/* Pro Plan – Hero card */}
              <Card className="billing-plan-hero">
                <Box padding="400">
                  <Box position="absolute" insetBlockStart="200" insetInlineEnd="200">
                    <Badge tone="info">Most Popular</Badge>
                  </Box>
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h3" fontWeight="bold">
                        Pro Plan
                      </Text>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text variant="heading2Xl" as="span" fontWeight="bold">
                          $19.99
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="span">
                          /mo
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        500 Credits
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      {PRO_FEATURES.map((item) => (
                        <InlineStack key={item} gap="200" blockAlign="center">
                          <Check size={16} style={{ color: TEAL, flexShrink: 0 }} aria-hidden />
                          <Text as="span" variant="bodySm">{item}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                    {isPro ? (
                      <Button fullWidth disabled>Current Plan</Button>
                    ) : (
                      <MagicButton fullWidth>Upgrade to Pro</MagicButton>
                    )}
                  </BlockStack>
                </Box>
              </Card>

              {/* Scale */}
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingLg" as="h3" fontWeight="bold">
                        Scale
                      </Text>
                      <InlineStack gap="100" blockAlign="baseline">
                        <Text variant="heading2Xl" as="span" fontWeight="bold">
                          $49.99
                        </Text>
                        <Text variant="bodyMd" tone="subdued" as="span">
                          /mo
                        </Text>
                      </InlineStack>
                      <Text variant="bodySm" tone="subdued">
                        2,000 Credits
                      </Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      {SCALE_FEATURES.map((item) => (
                        <InlineStack key={item} gap="200" blockAlign="center">
                          <Check size={16} style={{ color: TEAL, flexShrink: 0 }} aria-hidden />
                          <Text as="span" variant="bodySm">{item}</Text>
                        </InlineStack>
                      ))}
                    </BlockStack>
                    {isScale ? (
                      <Button fullWidth disabled>Current Plan</Button>
                    ) : (
                      <Button fullWidth variant="primary">
                        Upgrade to Scale
                      </Button>
                    )}
                  </BlockStack>
                </Box>
              </Card>
            </InlineGrid>
          </BlockStack>

          {/* 3. One-Time Credit Packs – for Pro/Scale only; lured for Free plan */}
          <div id="billing-topup-section" className={isFree ? 'billing-topup-lured' : ''}>
            <Card className="billing-topup-section">
            <Box padding="500">
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    Need more credits? Buy a Top-Up Pack
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    {isFree
                      ? 'Top-up packs are available on Pro or Scale. Upgrade above to unlock.'
                      : 'Credits roll over and never expire as long as you have an active plan.'}
                  </Text>
                  {!isFree && (
                    <InlineStack gap="200" blockAlign="center">
                      <span className="billing-topup-badge">One-time purchase</span>
                      <span className="billing-topup-badge">No subscription</span>
                    </InlineStack>
                  )}
                </BlockStack>
                <InlineGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="400">
                  {CREDIT_PACKS.map((pack) => (
                    <div
                      key={pack.id}
                      className={`billing-topup-card ${pack.popular ? 'billing-topup-card-popular' : ''}`}
                    >
                      {pack.popular && !isFree && (
                        <div className="billing-topup-card-badge">
                          <Badge tone="info">Best value</Badge>
                        </div>
                      )}
                      <BlockStack gap="300">
                        <div className="billing-topup-amount">
                          <Text variant="heading2Xl" as="span" fontWeight="bold">
                            {pack.credits.toLocaleString()}
                          </Text>
                          <Text variant="bodySm" as="span" tone="subdued">
                            credits
                          </Text>
                        </div>
                        <div className="billing-topup-price">
                          <Text variant="headingLg" as="span" fontWeight="bold">
                            {pack.price}
                          </Text>
                          <Text variant="bodySm" as="span" tone="subdued">
                            {pack.perCredit}/credit
                          </Text>
                        </div>
                        <Box paddingBlockStart="200">
                          <Button fullWidth variant="tertiary" size="medium" disabled={isFree}>
                            Buy Now
                          </Button>
                        </Box>
                      </BlockStack>
                    </div>
                  ))}
                </InlineGrid>
              </BlockStack>
            </Box>
          </Card>
            {isFree && (
              <div className="billing-topup-lured-overlay" role="presentation">
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Upgrade to Pro or Scale to buy top-up packs
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Choose a plan above to unlock one-time credit packs.
                  </Text>
                </BlockStack>
              </div>
            )}
          </div>

          {/* 4. Footer – Why invest in AI Photography (conversion-focused) */}
          <div className="billing-why-invest-wrapper">
          <Card className="billing-why-invest-section">
            <Box padding="0">
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text variant="headingLg" as="h2" fontWeight="bold">
                    Why invest in AI Photography?
                  </Text>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    More credits mean more listings that convert. Don’t leave sales on the table — keep creating.
                  </Text>
                </BlockStack>
                <InlineGrid columns={{ xs: 1, md: 3 }} gap="500">
                  <div className="billing-why-card">
                    <div className="billing-benefit-icon" aria-hidden>
                      <Camera size={24} style={{ color: TEAL }} />
                    </div>
                    <Text variant="headingSm" as="h3" fontWeight="semibold">
                      Product photos drive sales
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Turn browsers into buyers. Every credit you use can mean another product that sells.
                    </Text>
                  </div>
                  <div className="billing-why-card">
                    <div className="billing-benefit-icon" aria-hidden>
                      <Zap size={24} style={{ color: TEAL }} />
                    </div>
                    <Text variant="headingSm" as="h3" fontWeight="semibold">
                      Studio quality at a fraction of the cost
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Cinematic aesthetics without the shoot. Scale your catalog without scaling your budget.
                    </Text>
                  </div>
                  <div className="billing-why-card">
                    <div className="billing-benefit-icon" aria-hidden>
                      <Clock size={24} style={{ color: TEAL }} />
                    </div>
                    <Text variant="headingSm" as="h3" fontWeight="semibold">
                      Your time stays on your business
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Let AI handle the editing. Use your credits to ship more products and grow faster.
                    </Text>
                  </div>
                </InlineGrid>
                <div className="billing-why-cta">
                  <BlockStack gap="300">
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      Running low? Upgrade your plan or grab a Top-Up Pack above so you never hit a wall.
                    </Text>
                    <InlineStack gap="300" blockAlign="center">
                      <MagicButton
                        onClick={() => document.getElementById('billing-topup-section')?.scrollIntoView({ behavior: 'smooth' })}
                      >
                        Get more credits
                      </MagicButton>
                      <Text variant="bodySm" as="span" tone="subdued">
                        Credits roll over — use them when you need them.
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </div>
              </BlockStack>
            </Box>
          </Card>
          </div>

          {/* Bottom spacing */}
          <Box paddingBlockEnd="800" />
        </BlockStack>
      </Page>
    </ShopifyLayout>
  );
}
