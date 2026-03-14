import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Select,
  TextField,
  Box,
  Checkbox,
  ChoiceList,
  Button,
  Banner,
  Divider,
  Modal,
  InlineStack,
  Badge,
} from '@shopify/polaris';
import { useState, useCallback, useMemo, useEffect } from 'react';
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

const GENERATION_MODE_OPTIONS = [
  { label: 'Balanced (recommended)', value: 'balanced' },
  { label: 'Speed-first (faster output)', value: 'speed' },
  { label: 'Quality-first (best detail)', value: 'quality' },
];

const CREATIVITY_OPTIONS = [
  { label: 'Safe (minimal variation)', value: 'safe' },
  { label: 'Balanced', value: 'balanced' },
  { label: 'Bold (more variation)', value: 'bold' },
];

const BACKGROUND_STYLE_OPTIONS = [
  { label: 'Clean Studio', value: 'clean_studio' },
  { label: 'Lifestyle', value: 'lifestyle' },
  { label: 'Transparent / Cutout', value: 'transparent' },
  { label: 'Contextual Scene', value: 'contextual' },
];

const DIGEST_OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const BUSINESS_GOAL_OPTIONS = [
  { label: 'Maximize conversions', value: 'conversion' },
  { label: 'Publish catalog faster', value: 'catalog_velocity' },
  { label: 'Maintain brand consistency', value: 'brand_consistency' },
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
  generationMode: 'balanced',
  defaultCreativity: 'balanced',
  defaultBackgroundStyle: 'clean_studio',
  autoEnhanceFaces: false,
  autoBackgroundCleanup: true,
  autoPublishToProduct: false,
  notifyLowCredits: true,
  lowCreditThreshold: 50,
  weeklyPerformanceDigest: true,
  usageDigestFrequency: 'weekly',
  businessGoal: 'conversion',
  assetRetentionDays: 30,
  watermarkPreviewImages: false,
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
    if (typeof propsInitial.generationMode === 'string' && ['balanced', 'speed', 'quality'].includes(propsInitial.generationMode)) {
      base.generationMode = propsInitial.generationMode;
    }
    if (typeof propsInitial.defaultCreativity === 'string' && ['safe', 'balanced', 'bold'].includes(propsInitial.defaultCreativity)) {
      base.defaultCreativity = propsInitial.defaultCreativity;
    }
    if (typeof propsInitial.defaultBackgroundStyle === 'string' && ['clean_studio', 'lifestyle', 'transparent', 'contextual'].includes(propsInitial.defaultBackgroundStyle)) {
      base.defaultBackgroundStyle = propsInitial.defaultBackgroundStyle;
    }
    base.autoEnhanceFaces = Boolean(propsInitial.autoEnhanceFaces);
    base.autoBackgroundCleanup = propsInitial.autoBackgroundCleanup !== false;
    base.autoPublishToProduct = Boolean(propsInitial.autoPublishToProduct);
    base.notifyLowCredits = propsInitial.notifyLowCredits !== false;
    base.lowCreditThreshold = Number.isFinite(Number(propsInitial.lowCreditThreshold))
      ? Math.max(5, Math.min(1000, Number(propsInitial.lowCreditThreshold)))
      : 50;
    base.weeklyPerformanceDigest = propsInitial.weeklyPerformanceDigest !== false;
    if (typeof propsInitial.usageDigestFrequency === 'string' && ['daily', 'weekly', 'monthly'].includes(propsInitial.usageDigestFrequency)) {
      base.usageDigestFrequency = propsInitial.usageDigestFrequency;
    }
    if (typeof propsInitial.businessGoal === 'string' && ['conversion', 'catalog_velocity', 'brand_consistency'].includes(propsInitial.businessGoal)) {
      base.businessGoal = propsInitial.businessGoal;
    }
    base.assetRetentionDays = Number.isFinite(Number(propsInitial.assetRetentionDays))
      ? Math.max(7, Math.min(365, Number(propsInitial.assetRetentionDays)))
      : 30;
    base.watermarkPreviewImages = Boolean(propsInitial.watermarkPreviewImages);
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
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);

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
    settings.autoTagProducts !== initialFromServer.autoTagProducts ||
    settings.generationMode !== initialFromServer.generationMode ||
    settings.defaultCreativity !== initialFromServer.defaultCreativity ||
    settings.defaultBackgroundStyle !== initialFromServer.defaultBackgroundStyle ||
    settings.autoEnhanceFaces !== initialFromServer.autoEnhanceFaces ||
    settings.autoBackgroundCleanup !== initialFromServer.autoBackgroundCleanup ||
    settings.autoPublishToProduct !== initialFromServer.autoPublishToProduct ||
    settings.notifyLowCredits !== initialFromServer.notifyLowCredits ||
    Number(settings.lowCreditThreshold) !== Number(initialFromServer.lowCreditThreshold) ||
    settings.weeklyPerformanceDigest !== initialFromServer.weeklyPerformanceDigest ||
    settings.usageDigestFrequency !== initialFromServer.usageDigestFrequency ||
    settings.businessGoal !== initialFromServer.businessGoal ||
    Number(settings.assetRetentionDays) !== Number(initialFromServer.assetRetentionDays) ||
    settings.watermarkPreviewImages !== initialFromServer.watermarkPreviewImages;

  const handleSave = useCallback(() => {
    setIsSaving(true);
    router.put(route('shopify.settings.update'), {
      defaultFormat: settings.defaultFormat,
      defaultAspectRatio: settings.defaultAspectRatio,
      defaultResolution: settings.defaultResolution,
      autoUpscale: settings.defaultResolution === '2k',
      saveToShopify: settings.saveToShopify,
      autoTagProducts: settings.autoTagProducts,
      generationMode: settings.generationMode,
      defaultCreativity: settings.defaultCreativity,
      defaultBackgroundStyle: settings.defaultBackgroundStyle,
      autoEnhanceFaces: settings.autoEnhanceFaces,
      autoBackgroundCleanup: settings.autoBackgroundCleanup,
      autoPublishToProduct: settings.autoPublishToProduct,
      notifyLowCredits: settings.notifyLowCredits,
      lowCreditThreshold: Math.max(5, Number(settings.lowCreditThreshold) || 50),
      weeklyPerformanceDigest: settings.weeklyPerformanceDigest,
      usageDigestFrequency: settings.usageDigestFrequency,
      businessGoal: settings.businessGoal,
      assetRetentionDays: Math.max(7, Number(settings.assetRetentionDays) || 30),
      watermarkPreviewImages: settings.watermarkPreviewImages,
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
    setIsClearingHistory(true);
    router.delete(route('shopify.settings.history.clear'), {
      preserveScroll: true,
      onFinish: () => {
        setIsClearingHistory(false);
        closeClearHistoryModal();
      },
    });
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
            <Layout.AnnotatedSection
              title="Workspace Profile"
              description="Set a strategic profile so the AI output matches your business priorities and brand goals."
            >
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <Select
                      label="Business goal"
                      options={BUSINESS_GOAL_OPTIONS}
                      value={settings.businessGoal}
                      onChange={(v) => setSettings((s) => ({ ...s, businessGoal: v }))}
                    />
                    <Select
                      label="Generation mode"
                      options={GENERATION_MODE_OPTIONS}
                      value={settings.generationMode}
                      onChange={(v) => setSettings((s) => ({ ...s, generationMode: v }))}
                    />
                    <Select
                      label="Creativity level"
                      options={CREATIVITY_OPTIONS}
                      value={settings.defaultCreativity}
                      onChange={(v) => setSettings((s) => ({ ...s, defaultCreativity: v }))}
                    />
                    <Select
                      label="Preferred background style"
                      options={BACKGROUND_STYLE_OPTIONS}
                      value={settings.defaultBackgroundStyle}
                      onChange={(v) => setSettings((s) => ({ ...s, defaultBackgroundStyle: v }))}
                    />
                  </BlockStack>
                </Box>
              </Card>
            </Layout.AnnotatedSection>

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
                    <Checkbox
                      label="Auto-enhance faces when detected"
                      helpText="Recommended for lifestyle/product-on-model visuals."
                      checked={settings.autoEnhanceFaces}
                      onChange={(v) => setSettings((s) => ({ ...s, autoEnhanceFaces: v }))}
                    />
                    <Checkbox
                      label="Auto background cleanup"
                      helpText="Reduce manual edits by applying cleanup defaults automatically."
                      checked={settings.autoBackgroundCleanup}
                      onChange={(v) => setSettings((s) => ({ ...s, autoBackgroundCleanup: v }))}
                    />
                    <Checkbox
                      label="Watermark preview images"
                      helpText="Protect review drafts before final export or publish."
                      checked={settings.watermarkPreviewImages}
                      onChange={(v) => setSettings((s) => ({ ...s, watermarkPreviewImages: v }))}
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
                    <Checkbox
                      label="Auto-publish final output to product"
                      helpText="When enabled, approved outputs are pushed automatically according to your save rule."
                      checked={settings.autoPublishToProduct}
                      onChange={(v) => setSettings((s) => ({ ...s, autoPublishToProduct: v }))}
                    />
                  </BlockStack>
                </Box>
              </Card>
            </Layout.AnnotatedSection>

            <Layout.AnnotatedSection
              title="Alerts & Reporting"
              description="Keep merchants proactive with meaningful credit and performance notifications."
            >
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <Checkbox
                      label="Notify when credits are low"
                      checked={settings.notifyLowCredits}
                      onChange={(v) => setSettings((s) => ({ ...s, notifyLowCredits: v }))}
                    />
                    <TextField
                      label="Low credit alert threshold"
                      type="number"
                      min={5}
                      max={1000}
                      autoComplete="off"
                      value={String(settings.lowCreditThreshold)}
                      onChange={(v) => setSettings((s) => ({ ...s, lowCreditThreshold: v }))}
                      suffix="credits"
                    />
                    <Divider />
                    <Checkbox
                      label="Send performance digest email"
                      checked={settings.weeklyPerformanceDigest}
                      onChange={(v) => setSettings((s) => ({ ...s, weeklyPerformanceDigest: v }))}
                    />
                    <Select
                      label="Digest frequency"
                      options={DIGEST_OPTIONS}
                      value={settings.usageDigestFrequency}
                      onChange={(v) => setSettings((s) => ({ ...s, usageDigestFrequency: v }))}
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
                    <TextField
                      label="Asset retention period"
                      type="number"
                      min={7}
                      max={365}
                      autoComplete="off"
                      value={String(settings.assetRetentionDays)}
                      onChange={(v) => setSettings((s) => ({ ...s, assetRetentionDays: v }))}
                      suffix="days"
                      helpText="Used by housekeeping policies for generated assets."
                    />
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
        </BlockStack>

        <Modal
          open={clearHistoryModalOpen}
          onClose={closeClearHistoryModal}
          title="Clear generation history?"
          primaryAction={{
            content: isClearingHistory ? 'Clearing...' : 'Clear history',
            onAction: handleConfirmClearHistory,
            destructive: true,
            loading: isClearingHistory,
          }}
          secondaryActions={[{ content: 'Cancel', onAction: closeClearHistoryModal, disabled: isClearingHistory }]}
        >
          <Modal.Section>
            <BlockStack gap="300">
              <Banner tone="critical">
                This action cannot be undone. All generated history stored by this app will be permanently deleted.
              </Banner>
              <Text as="p" variant="bodyMd" tone="subdued">
                Shopify product images are not deleted. Only generation records and app-hosted files are removed.
              </Text>
              <InlineStack gap="200" blockAlign="center">
                <Badge tone="attention">Permanent action</Badge>
                <Badge tone="info">Store-safe</Badge>
              </InlineStack>
            </BlockStack>
          </Modal.Section>
        </Modal>
      </Page>
    </ShopifyLayout>
  );
}
