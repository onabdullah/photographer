import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Select,
  Box,
  Checkbox,
  ChoiceList,
  Button,
  Banner,
} from '@shopify/polaris';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import { TitleBar } from '@shopify/app-bridge-react';
import MagicButton from '@/Shopify/Components/MagicButton';

const IMAGE_FORMAT_OPTIONS = [
  { label: 'WebP', value: 'webp' },
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
];

const ASPECT_RATIO_OPTIONS = [
  { label: 'Original (keep source aspect ratio)', value: 'original' },
  { label: '1:1 Square', value: '1:1' },
  { label: '4:5 Portrait', value: '4:5' },
  { label: '16:9 Landscape', value: '16:9' },
];

const RESOLUTION_OPTIONS = [
  { label: 'Original (keep source resolution)', value: 'original' },
  { label: '2K (uses 1 extra credit per generation)', value: '2k' },
];

const SAVE_TO_SHOPIFY_CHOICES = [
  { label: 'Add as a new secondary image', value: 'add_secondary', helpText: 'Recommended' },
  { label: 'Replace the primary product image', value: 'replace_primary' },
];

const DEFAULT_SETTINGS = {
  defaultFormat: 'webp',
  defaultAspectRatio: 'original',
  defaultResolution: 'original',
  autoUpscale: false,
  saveToShopify: ['add_secondary'],
  autoTagProducts: true,
};

function normalizeInitial(propsInitial) {
  const base = { ...DEFAULT_SETTINGS };
  if (propsInitial && typeof propsInitial === 'object') {
    if (typeof propsInitial.defaultFormat === 'string') base.defaultFormat = propsInitial.defaultFormat;
    if (typeof propsInitial.defaultAspectRatio === 'string' && ['original', '1:1', '4:5', '16:9'].includes(propsInitial.defaultAspectRatio)) {
      base.defaultAspectRatio = propsInitial.defaultAspectRatio;
    }
    base.defaultResolution = propsInitial.defaultResolution === '2k' ? '2k' : 'original';
    base.autoUpscale = Boolean(propsInitial.autoUpscale);
    base.autoTagProducts = Boolean(propsInitial.autoTagProducts);
    if (Array.isArray(propsInitial.saveToShopify) && propsInitial.saveToShopify.length) {
      base.saveToShopify = [...propsInitial.saveToShopify];
    }
  }
  return base;
}

export default function Settings() {
  const { props } = usePage();
  const initialFromServer = useMemo(() => normalizeInitial(props.initialSettings), [props.initialSettings]);
  const [settings, setSettings] = useState(initialFromServer);
  const [isSaving, setIsSaving] = useState(false);
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);
  const clearHistoryModalRef = useRef(null);

  useEffect(() => {
    const el = clearHistoryModalRef.current;
    if (!el) return;
    if (clearHistoryModalOpen) el.show?.(); else el.hide?.();
  }, [clearHistoryModalOpen]);

  useEffect(() => {
    const el = clearHistoryModalRef.current;
    if (!el) return;
    const onHide = () => setClearHistoryModalOpen(false);
    el.addEventListener('hide', onHide);
    return () => el.removeEventListener('hide', onHide);
  }, []);

  // Sync local state when server sends new initial (e.g. after save or navigation)
  useEffect(() => {
    setSettings(initialFromServer);
  }, [initialFromServer]);

  const isDirty =
    settings.defaultFormat !== initialFromServer.defaultFormat ||
    settings.defaultAspectRatio !== initialFromServer.defaultAspectRatio ||
    settings.defaultResolution !== initialFromServer.defaultResolution ||
    settings.autoUpscale !== initialFromServer.autoUpscale ||
    JSON.stringify(settings.saveToShopify) !== JSON.stringify(initialFromServer.saveToShopify) ||
    settings.autoTagProducts !== initialFromServer.autoTagProducts;

  const handleSave = useCallback(() => {
    setIsSaving(true);
    router.put(route('shopify.settings.update'), {
      defaultFormat: settings.defaultFormat,
      defaultAspectRatio: settings.defaultAspectRatio,
      defaultResolution: settings.defaultResolution,
      autoUpscale: settings.defaultResolution === '2k',
      saveToShopify: settings.saveToShopify,
      autoTagProducts: settings.autoTagProducts,
    }, {
      preserveScroll: true,
      onFinish: () => setIsSaving(false),
    });
  }, [settings]);

  const handleDiscard = useCallback(() => {
    setSettings({ ...initialFromServer });
  }, [initialFromServer]);

  const openClearHistoryModal = useCallback(() => setClearHistoryModalOpen(true), []);
  const closeClearHistoryModal = useCallback(() => setClearHistoryModalOpen(false), []);
  const handleConfirmClearHistory = useCallback(() => {
    // TODO: call API to clear history
    closeClearHistoryModal();
  }, [closeClearHistoryModal]);

  const successMessage = props.flash?.success ?? null;

  return (
    <ShopifyLayout>
      {/* App Bridge TitleBar — shows Save/Discard in the Shopify Admin top chrome when there are unsaved changes */}
      {isDirty ? (
        <TitleBar title="App Settings">
          <button variant="primary" onClick={handleSave} disabled={isSaving}>
            Save
          </button>
          <button onClick={handleDiscard} disabled={isSaving}>
            Discard
          </button>
        </TitleBar>
      ) : (
        <TitleBar title="App Settings" />
      )}
      <Page title="App Settings" subtitle="Tailor AI Studio to your workflow.">
        <BlockStack gap="600">
          {successMessage && (
            <Banner tone="success" onDismiss={() => {}}>
              {successMessage}
            </Banner>
          )}

          <Layout>
            {/* Section 1: Output Preferences */}
            <Layout.AnnotatedSection
              title="Image Output"
              description="Set your global preferences for how AI generates and formats your images. WebP is recommended for store speed."
            >
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <Select
                      label="Default Image Format"
                      options={IMAGE_FORMAT_OPTIONS}
                      value={settings.defaultFormat}
                      onChange={(v) => setSettings((s) => ({ ...s, defaultFormat: v }))}
                    />
                    <Select
                      label="Default Aspect Ratio"
                      options={ASPECT_RATIO_OPTIONS}
                      value={settings.defaultAspectRatio}
                      onChange={(v) => setSettings((s) => ({ ...s, defaultAspectRatio: v }))}
                    />
                    <Select
                      label="Default output resolution"
                      options={RESOLUTION_OPTIONS}
                      value={settings.defaultResolution}
                      onChange={(v) => setSettings((s) => ({ ...s, defaultResolution: v, autoUpscale: v === '2k' }))}
                    />
                  </BlockStack>
                </Box>
              </Card>
            </Layout.AnnotatedSection>

            {/* Section 2: Shopify Integration */}
            <Layout.AnnotatedSection
              title="Store Syncing"
              description="Control how enhanced images interact with your live Shopify products."
            >
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <ChoiceList
                      title="When saving to Shopify:"
                      choices={SAVE_TO_SHOPIFY_CHOICES}
                      selected={settings.saveToShopify}
                      allowMultiple={false}
                      onChange={(v) => setSettings((s) => ({ ...s, saveToShopify: v }))}
                    />
                    <Checkbox
                      label="Auto-Tag Products"
                      helpText='Add the tag "AI-Enhanced" to products modified by this app.'
                      checked={settings.autoTagProducts}
                      onChange={(v) => setSettings((s) => ({ ...s, autoTagProducts: v }))}
                    />
                  </BlockStack>
                </Box>
              </Card>
            </Layout.AnnotatedSection>

            {/* Section 3: Data Management */}
            <Layout.AnnotatedSection
              title="Data & Privacy"
              description="Manage your generation history and storage."
            >
              <Card>
                <Box padding="400">
                  <BlockStack gap="300">
                    <Button tone="critical" size="slim" onClick={openClearHistoryModal}>
                      Clear Generation History
                    </Button>
                    <Text variant="bodySm" as="p" tone="subdued">
                      This will permanently delete your recent creations from our servers. This cannot be undone.
                    </Text>
                  </BlockStack>
                </Box>
              </Card>
            </Layout.AnnotatedSection>
          </Layout>

          {/* Clear history confirmation modal */}
          <ui-modal id="clear-history-modal" ref={clearHistoryModalRef}>
            <div style={{ padding: '20px' }}>
              <BlockStack gap="400">
                <Banner tone="critical">
                  This action cannot be undone. All your generated images and history on our servers will be permanently deleted.
                </Banner>
                <Text as="p" variant="bodyMd" tone="subdued">
                  If you clear your history, you will lose access to previously generated images stored by this app. Your Shopify products and their images are not affected.
                </Text>
              </BlockStack>
            </div>
            <ui-title-bar title="Clear generation history?">
              <button variant="primary" tone="critical" onClick={handleConfirmClearHistory}>Clear history</button>
              <button onClick={closeClearHistoryModal}>Cancel</button>
            </ui-title-bar>
          </ui-modal>
        </BlockStack>
      </Page>
    </ShopifyLayout>
  );
}
