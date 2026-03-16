import { useState, useEffect, useCallback, useRef } from 'react';
import { BlockStack, Text, Box, InlineStack } from '@shopify/polaris';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Sparkles, Rocket, TrendingUp } from 'lucide-react';
import MagicButton from '@/Shopify/Components/MagicButton';

const STORAGE_KEY = 'hasSeenWelcomeModal';
const CONFETTI_DURATION_MS = 5000;
const BRAND_TEAL = 'var(--premium-teal, #468A9A)';

const VALUE_PROPS = [
  {
    icon: Sparkles,
    title: 'Studio Quality in Seconds',
    description: 'Flawless background removal, lighting, and enhancement.',
  },
  {
    icon: Rocket,
    title: 'Scale Without Limits',
    description: 'Generate infinite professional variations for every product.',
  },
  {
    icon: TrendingUp,
    title: 'Turn Browsers into Buyers',
    description: 'High-end visuals proven to skyrocket your conversion rates.',
  },
];

export default function WelcomeModal() {
  const { width, height } = useWindowSize();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowConfetti(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    if (isOpen) el.show?.(); else el.hide?.();
  }, [isOpen]);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.addEventListener('hide', handleClose);
    return () => el.removeEventListener('hide', handleClose);
  }, [handleClose]);

  // On mount: if user has never seen the modal, open it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setIsOpen(true);
  }, []);

  // When modal opens, start confetti and stop it after 5 seconds
  useEffect(() => {
    if (!isOpen) return;
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), CONFETTI_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <>
      {/* Confetti overlay – full viewport when modal is open */}
      {isOpen && width > 0 && height > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9998,
          }}
          aria-hidden="true"
        >
          <Confetti width={width} height={height} recycle={showConfetti} />
        </div>
      )}

      <ui-modal id="welcome-modal" ref={modalRef} variant="large">
        {/* Top – 5 free credits + two lines */}
        <div style={{ padding: '20px', display: isOpen ? undefined : 'none' }}>
          <BlockStack gap="300" align="center" inlineAlign="center">
            <Text as="p" variant="bodyLg">
              You got{' '}
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--premium-orange, #FF7A30)',
                  letterSpacing: '-0.02em',
                }}
              >
                5 free credits
              </span>
            </Text>
            <BlockStack gap="100" align="center" inlineAlign="center">
              <Text variant="bodyMd" tone="subdued">
                Worldwide, lots of businesses have grown using AI. Now it's your turn.
              </Text>
              <Text variant="bodyMd" tone="subdued">
                Say goodbye to expensive photoshoots, and hello to endless AI creativity.
              </Text>
            </BlockStack>
          </BlockStack>
        </div>

        {/* Value props – subtle card, left-aligned */}
        <div style={{ padding: '0 20px', display: isOpen ? undefined : 'none' }}>
          <Box
            padding="400"
            background="bg-surface-secondary"
            borderRadius="300"
          >
            <BlockStack gap="400">
              {VALUE_PROPS.map(({ icon: Icon, title, description }) => (
                <InlineStack key={title} wrap={false} gap="300" blockAlign="center">
                  <Box minWidth="fit-content">
                    <Icon size={24} style={{ color: BRAND_TEAL }} aria-hidden />
                  </Box>
                  <BlockStack gap="100">
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {title}
                    </Text>
                    <Text as="span" variant="bodySm" tone="subdued">
                      {description}
                    </Text>
                  </BlockStack>
                </InlineStack>
              ))}
            </BlockStack>
          </Box>
        </div>

        {/* CTA – small button */}
        <div style={{ padding: '20px', display: isOpen ? undefined : 'none' }}>
          <BlockStack gap="300" inlineAlign="center">
            <MagicButton size="slim" onClick={handleClose}>
              Let's Create Magic 🚀
            </MagicButton>
          </BlockStack>
        </div>
        <ui-title-bar title="Welcome to the Future e-commerce ✨" style={{ display: isOpen ? undefined : 'none' }}>
          <button variant="primary" onClick={handleClose}>Let's Create Magic 🚀</button>
        </ui-title-bar>
      </ui-modal>
    </>
  );
}
