import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import { Page, Layout, Card, Text, Badge } from '@shopify/polaris';
import { useState } from 'react';
import MagicButton from '@/Shopify/Components/MagicButton';

export default function AiModels() {
  const [isNotified, setIsNotified] = useState(false);

  return (
    <ShopifyLayout>
      <Page title="AI Models (Virtual Try-On)">
        <Layout>
          <Layout.Section>
            <Card padding="0">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              minHeight: '70vh',
              padding: '80px 20px',
              gap: '24px',
            }}
          >
            {/* Logo */}
            <img
              src="/assets/logo/logo.png"
              alt=""
              width={80}
              height={80}
              style={{ marginBottom: '8px', display: 'block' }}
            />

            {/* Badge */}
            <Badge tone="attention">Coming Soon</Badge>

            {/* Headline */}
            <Text variant="heading3xl" as="h1">
              AI Model Try-On is Arriving Soon.
            </Text>

            {/* Subtext – constrained width for readable line length */}
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <Text variant="bodyLg" tone="subdued">
                Our dedicated team is building something extraordinary. Soon, you will be able to upload your garments and instantly generate flawless lifestyle model photos without ever booking a studio.
              </Text>
            </div>

            {/* Button container */}
            <div style={{ marginTop: '16px' }}>
              <MagicButton
                size="medium"
                onClick={() => setIsNotified(true)}
                disabled={isNotified}
              >
                {isNotified ? '🎉 You are on the waitlist!' : '🔔 Notify Me When It Drops'}
              </MagicButton>
            </div>
          </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </ShopifyLayout>
  );
}
