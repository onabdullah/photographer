import { useState, useCallback } from 'react';
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
  Banner,
} from '@shopify/polaris';
import { Camera, Zap, Clock, Check } from 'lucide-react';
import MagicButton from '@/Shopify/Components/MagicButton';
import axios from 'axios';

const TEAL = '#468A9A';

export default function Billing({ credits, creditSummary = null, currentPlan, plans = [], creditPacks = [] }) {
  const planName = currentPlan?.name ?? 'Free Trial';
  const creditsRemaining = typeof credits === 'number' ? credits : 0;
  const monthlyAllowance = creditSummary?.plan_cycle_credits ?? currentPlan?.credits_per_month ?? 5;
  const monthlyRemaining = creditSummary?.plan_cycle_remaining ?? Math.min(creditsRemaining, monthlyAllowance);
  const topUpCredits = creditSummary?.top_up_credits ?? Math.max(0, creditsRemaining - monthlyRemaining);
  const progress = monthlyAllowance > 0 ? Math.min(100, Math.round((monthlyRemaining / monthlyAllowance) * 100)) : 0;

  // Sort plans by price (ascending) to display consistently
  const sortedPlans = [...plans].sort((a, b) => a.price - b.price);
  
  // Determine if current plan is free (price = 0)
  const isFree = !currentPlan || currentPlan.price === 0;
  
  // Find the most popular plan (middle one or highest non-free)
  const popularPlanIndex = sortedPlans.length > 2 ? 1 : sortedPlans.findIndex(p => p.price > 0);

  const [subscribingId, setSubscribingId] = useState(null);
  const [toppingUpId, setToppingUpId] = useState(null);
  const [billingError, setBillingError] = useState('');

  const host = new URLSearchParams(window.location.search).get('host') ?? '';

  const handleSubscribe = useCallback(async (planId) => {
    if (subscribingId) return;
    setBillingError('');
    setSubscribingId(planId);
    
    console.log('[Billing] Subscribing to plan:', planId);
    console.log('[Billing] Host parameter:', host);
    console.log('[Billing] Session token available:', !!window.sessionToken);
    
    try {
      const { data } = await axios.post('/shopify/billing/subscribe', { plan_id: planId, host });
      console.log('[Billing] Subscribe response:', data);
      
      if (data.confirmation_url) {
        console.log('[Billing] Redirecting to:', data.confirmation_url);
        // Redirect the top-level frame so Shopify billing page loads outside the iframe
        window.top.location.replace(data.confirmation_url);
      } else {
        console.error('[Billing] No confirmation URL in response');
        setBillingError('Could not start billing. No confirmation URL received.');
        setSubscribingId(null);
      }
    } catch (err) {
      console.error('[Billing] Subscribe error:', err);
      console.error('[Billing] Error response:', err.response?.data);
      setBillingError(err.response?.data?.error ?? 'Could not start billing. Please try again.');
      setSubscribingId(null);
    }
  }, [subscribingId, host]);

  const handleTopUp = useCallback(async (packId) => {
    if (toppingUpId) return;
    setBillingError('');
    setToppingUpId(packId);
    try {
      const { data } = await axios.post('/shopify/billing/top-up', { pack_id: packId, host });
      if (data.confirmation_url) {
        window.top.location.replace(data.confirmation_url);
      }
    } catch (err) {
      setBillingError(err.response?.data?.error ?? 'Could not start top-up. Please try again.');
      setToppingUpId(null);
    }
  }, [toppingUpId, host]);

  // Check if current user is on this plan
  const isCurrentPlan = (plan) => currentPlan?.id === plan.id;

  return (
    <ShopifyLayout>
      <Page
        title="Plans & Billing"
        subtitle="Manage your AI credits and choose the plan that fits your business scale."
      >
        <BlockStack gap="600">
          {billingError && (
            <Banner tone="critical" onDismiss={() => setBillingError('')}>
              {billingError}
            </Banner>
          )}

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
                    Credits Available: {creditsRemaining.toLocaleString()}
                  </Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Monthly plan credits: {monthlyRemaining.toLocaleString()} / {monthlyAllowance.toLocaleString()}
                    {topUpCredits > 0 ? ` · Extra top-up credits: ${topUpCredits.toLocaleString()}` : ''}
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
            <InlineGrid columns={{ xs: 1, md: plans.length >= 3 ? 3 : plans.length }} gap="400">
              {sortedPlans.map((plan, index) => {
                const planFeatures = plan.features && plan.features.length > 0 ? plan.features : [
                  `${plan.credits_per_month.toLocaleString()} AI generation${plan.credits_per_month !== 1 ? 's' : ''} ${plan.price === 0 ? 'to start' : '/ month'}`,
                  'All AI tools unlocked',
                ];
                const isPopular = index === popularPlanIndex;
                const isCurrent = isCurrentPlan(plan);
                const CardComponent = isPopular ? ({ children, className }) => (
                  <Card className={`billing-plan-hero ${className || ''}`}>{children}</Card>
                ) : Card;
                
                return (
                  <CardComponent key={plan.id}>
                    <Box padding="400">
                      {isPopular && (
                        <Box position="absolute" insetBlockStart="200" insetInlineEnd="200">
                          <Badge tone="info">Most Popular</Badge>
                        </Box>
                      )}
                      <BlockStack gap="400">
                        <BlockStack gap="200">
                          <Text variant="headingLg" as="h3" fontWeight="bold">
                            {plan.name}
                          </Text>
                          <InlineStack gap="100" blockAlign="baseline">
                            <Text variant="heading2Xl" as="span" fontWeight="bold">
                              ${plan.price.toFixed(2)}
                            </Text>
                            <Text variant="bodyMd" tone="subdued" as="span">
                              /mo
                            </Text>
                          </InlineStack>
                          <Text variant="bodySm" tone="subdued">
                            {plan.credits_per_month.toLocaleString()} Credits
                          </Text>
                        </BlockStack>
                        <BlockStack gap="200">
                          {planFeatures.map((item) => (
                            <InlineStack key={item} gap="200" blockAlign="center">
                              <Check size={16} style={{ color: TEAL, flexShrink: 0 }} aria-hidden />
                              <Text as="span" variant="bodySm">{item}</Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                        {isCurrent ? (
                          <Button fullWidth disabled>Current Plan</Button>
                        ) : plan.price === 0 ? (
                          <Button fullWidth variant="tertiary" disabled>
                            {plan.name}
                          </Button>
                        ) : isPopular ? (
                          <MagicButton
                            fullWidth
                            loading={subscribingId === plan.id}
                            disabled={!!subscribingId}
                            onClick={() => handleSubscribe(plan.id)}
                          >
                            {subscribingId === plan.id ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                          </MagicButton>
                        ) : (
                          <Button
                            fullWidth
                            variant="primary"
                            loading={subscribingId === plan.id}
                            disabled={!!subscribingId}
                            onClick={() => handleSubscribe(plan.id)}
                          >
                            {subscribingId === plan.id ? 'Redirecting…' : `Upgrade to ${plan.name}`}
                          </Button>
                        )}
                      </BlockStack>
                    </Box>
                  </CardComponent>
                );
              })}
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
                      ? 'Top-up packs are available on paid plans. Upgrade above to unlock.'
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
                  {creditPacks.map((pack) => {
                    const formattedPrice = `$${pack.price.toFixed(2)}`;
                    const perCreditCents = pack.per_credit_cost
                      ? `${(pack.per_credit_cost * 100).toFixed(1)}¢`
                      : `${((pack.price / pack.credits) * 100).toFixed(1)}¢`;
                    
                    return (
                      <div
                        key={pack.id}
                        className={`billing-topup-card ${pack.is_popular ? 'billing-topup-card-popular' : ''}`}
                      >
                        {pack.is_popular && !isFree && (
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
                              {formattedPrice}
                            </Text>
                            <Text variant="bodySm" as="span" tone="subdued">
                              {perCreditCents}/credit
                            </Text>
                          </div>
                          <Box paddingBlockStart="200">
                            <Button
                              fullWidth
                              variant="tertiary"
                              size="medium"
                              disabled={isFree || !!toppingUpId}
                              loading={toppingUpId === pack.id}
                              onClick={() => !isFree && handleTopUp(pack.id)}
                            >
                              {toppingUpId === pack.id ? 'Redirecting…' : 'Buy Now'}
                            </Button>
                          </Box>
                        </BlockStack>
                      </div>
                    );
                  })}
                </InlineGrid>
              </BlockStack>
            </Box>
          </Card>
            {isFree && (
              <div className="billing-topup-lured-overlay" role="presentation">
                <BlockStack gap="200">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Upgrade to a paid plan to buy top-up packs
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
