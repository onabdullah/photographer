import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Card,
  Text,
  BlockStack,
  InlineStack,
  InlineGrid,
  Box,
  Button,
  DropZone,
  Select,
  TextField,
  Badge,
  Banner,
  Collapsible,
  Divider,
  RadioButton,
} from '@shopify/polaris';
import { PlusIcon, ImageIcon } from '@shopify/polaris-icons';
import { Camera, Sparkles, Layers } from 'lucide-react';
import { useState, useCallback } from 'react';
import axios from 'axios';

// ─── Constants ───────────────────────────────────────────────────────────────

const MODEL_PRESETS = [
  { value: 'none',       label: 'Upload Custom Model' },
  { value: 'female-studio',  label: 'Female Model – Studio White' },
  { value: 'female-outdoor', label: 'Female Model – Outdoor Natural' },
  { value: 'male-studio',    label: 'Male Model – Studio Gray' },
  { value: 'male-urban',     label: 'Male Model – Urban Street' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Reusable minimal dropzone used across both tabs and the Pro Drawer.
 */
function DropZoneArea({ label, hint, file, onDrop }) {
  const handleDrop = useCallback(
    (_dropped, accepted) => {
      if (accepted.length > 0) onDrop(accepted[0]);
    },
    [onDrop],
  );

  const handleRemove = useCallback(
    (e) => {
      e.stopPropagation();
      onDrop(null);
    },
    [onDrop],
  );

  return (
    <Box borderWidth="025" borderColor="border" borderRadius="200" padding="300">
      <BlockStack gap="200">
        <Text variant="bodyMd" fontWeight="semibold">
          {label}
        </Text>
        {hint && (
          <Text variant="bodySm" tone="subdued">
            {hint}
          </Text>
        )}
        <DropZone accept="image/png,image/jpeg,image/webp" type="image" onDrop={handleDrop} allowMultiple={false}>
          {file ? (
            <Box padding="300">
              <InlineStack gap="300" blockAlign="center">
                <img
                  src={URL.createObjectURL(file)}
                  alt={label}
                  style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }}
                />
                <BlockStack gap="100">
                  <Text variant="bodySm" fontWeight="medium" truncate>
                    {file.name}
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    {(file.size / 1024).toFixed(0)} KB
                  </Text>
                  <Button variant="plain" size="micro" tone="critical" onClick={handleRemove}>
                    Remove
                  </Button>
                </BlockStack>
              </InlineStack>
            </Box>
          ) : (
            <DropZone.FileUpload actionTitle="Add image" actionHint="PNG, JPG or WebP" />
          )}
        </DropZone>
      </BlockStack>
    </Box>
  );
}

/**
 * Credit cost badge — turns amber at 4 credits.
 */
function CreditBadge({ cost }) {
  return <Badge tone={cost >= 4 ? 'warning' : 'info'}>{cost} Credit{cost !== 1 ? 's' : ''}</Badge>;
}

/**
 * Single gallery card with "Save to Product Media" CTA.
 */
function GalleryItem({ generation, isSaving, onSave }) {
  const url = generation.result_image_url;
  if (!url) return null;

  const toolLabel = (generation.tool_used ?? '')
    .replace(/_/g, ' ')
    .replace(/\bai\b/gi, 'AI')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Box borderWidth="025" borderColor="border" borderRadius="200" overflow="hidden" shadow="card">
      <BlockStack gap="0">
        <img
          src={url}
          alt="AI generation"
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block' }}
        />
        <Box padding="300">
          <BlockStack gap="200">
            <Text variant="bodySm" tone="subdued">
              {toolLabel}
            </Text>
            <Button
              variant="primary"
              size="slim"
              fullWidth
              loading={isSaving}
              disabled={isSaving}
              onClick={() => onSave(generation.id, url)}
            >
              Save to Product Media
            </Button>
          </BlockStack>
        </Box>
      </BlockStack>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AiStudioPro({ credits = 0, recentGenerations = [] }) {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [selectedTab, setSelectedTab] = useState(0);

  // ── Tab 1: Apparel Lab ─────────────────────────────────────────────────────
  const [garmentFile,   setGarmentFile]   = useState(null);
  const [modelFile,     setModelFile]     = useState(null);
  const [modelPreset,   setModelPreset]   = useState('none');
  const [apparelLoading, setApparelLoading] = useState(false);
  const [apparelResult,  setApparelResult]  = useState(null);
  const [apparelError,   setApparelError]   = useState(null);

  // ── Tab 2: Universal Studio ────────────────────────────────────────────────
  const [productFile,   setProductFile]   = useState(null);
  const [intent,        setIntent]        = useState('environment');
  const [scenePrompt,   setScenePrompt]   = useState('');
  const [refsExpanded,  setRefsExpanded]  = useState(false);
  const [styleRefFile,  setStyleRefFile]  = useState(null);
  const [faceRefFile,   setFaceRefFile]   = useState(null);
  const [poseRefFile,   setPoseRefFile]   = useState(null);
  const [universalLoading, setUniversalLoading] = useState(false);
  const [universalResult,  setUniversalResult]  = useState(null);
  const [universalError,   setUniversalError]   = useState(null);

  // ── Gallery ────────────────────────────────────────────────────────────────
  const [generations, setGenerations] = useState(recentGenerations);
  const [savingId,    setSavingId]    = useState(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const hasRefs      = Boolean(styleRefFile || faceRefFile || poseRefFile);
  const universalCost = hasRefs ? 4 : 2;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleApparelGenerate = useCallback(async () => {
    if (!garmentFile) return;
    setApparelLoading(true);
    setApparelError(null);
    try {
      const formData = new FormData();
      formData.append('product_category', 'apparel');
      formData.append('image', garmentFile); // matches resolveImageUrlFromRequest()
      if (modelFile) formData.append('model_image', modelFile);
      formData.append('model_preset', modelPreset);

      const { data } = await axios.post('/shopify/ai-studio/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setApparelResult(data.result_url);
        if (data.generation) setGenerations((prev) => [data.generation, ...prev]);
      } else {
        setApparelError(data.message ?? 'Generation failed. Please try again.');
      }
    } catch (err) {
      setApparelError(err.response?.data?.message ?? 'An unexpected error occurred.');
    } finally {
      setApparelLoading(false);
    }
  }, [garmentFile, modelFile, modelPreset]);

  const handleUniversalGenerate = useCallback(async () => {
    if (!productFile) return;
    setUniversalLoading(true);
    setUniversalError(null);
    try {
      const formData = new FormData();
      formData.append('product_category', 'universal');
      formData.append('image', productFile); // matches resolveImageUrlFromRequest()
      formData.append('prompt', scenePrompt);
      formData.append('intent', intent);
      if (styleRefFile) formData.append('reference_images[style]', styleRefFile);
      if (faceRefFile)  formData.append('reference_images[face]',  faceRefFile);
      if (poseRefFile)  formData.append('reference_images[pose]',  poseRefFile);

      const { data } = await axios.post('/shopify/ai-studio/generate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.success) {
        setUniversalResult(data.result_url);
        if (data.generation) setGenerations((prev) => [data.generation, ...prev]);
      } else {
        setUniversalError(data.message ?? 'Generation failed. Please try again.');
      }
    } catch (err) {
      setUniversalError(err.response?.data?.message ?? 'An unexpected error occurred.');
    } finally {
      setUniversalLoading(false);
    }
  }, [productFile, scenePrompt, intent, styleRefFile, faceRefFile, poseRefFile]);

  const handleSaveToShopify = useCallback(async (generationId, resultUrl) => {
    setSavingId(generationId);
    try {
      await axios.post('/shopify/save-to-shopify', {
        generation_id: generationId,
        image_url: resultUrl,
      });
    } catch {
      // Non-blocking — user can retry via Shopify admin
    } finally {
      setSavingId(null);
    }
  }, []);

  // ── Tab definitions ────────────────────────────────────────────────────────
  const TABS = [
    { id: 'apparel',   label: 'Apparel & Garment Lab',     Icon: Camera },
    { id: 'universal', label: 'Universal Product Studio',  Icon: Sparkles },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ShopifyLayout>
      <Page
        title="AI Studio Pro"
        subtitle="Advanced AI image generation for every product category"
        secondaryActions={[{ content: `✦ ${credits} credits`, disabled: true }]}
      >
        <BlockStack gap="600">

          {/* ── Tab Navigation + Content ─────────────────────────────────── */}
          <Card>
            <BlockStack gap="0">

              {/* Tab Bar */}
              <Box paddingBlockEnd="400">
                <InlineStack gap="200">
                  {TABS.map(({ id, label, Icon }, i) => (
                    <button
                      key={id}
                      onClick={() => setSelectedTab(i)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 18px',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontWeight: selectedTab === i ? 700 : 500,
                        fontSize: 14,
                        background: selectedTab === i ? 'var(--p-color-bg-fill-selected, #1a1a2e)' : 'var(--p-color-bg-surface-secondary, #f6f6f7)',
                        color: selectedTab === i ? '#ffffff' : 'var(--p-color-text, #202223)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </InlineStack>
              </Box>

              <Divider />

              <Box paddingBlockStart="500">

                {/* ══════════════════════════════════════════════════════════
                    TAB 1 — Apparel & Garment Lab
                ══════════════════════════════════════════════════════════ */}
                {selectedTab === 0 && (
                  <BlockStack gap="500">
                    <BlockStack gap="100">
                      <Text variant="headingMd">Apparel & Garment Lab</Text>
                      <Text variant="bodySm" tone="subdued">
                        Upload a garment and choose a model to generate professional virtual try-on photos via the VTON pipeline.
                      </Text>
                    </BlockStack>

                    <InlineGrid columns={{ xs: 1, sm: 2 }} gap="400">
                      {/* Dropzone 1 — Garment */}
                      <DropZoneArea
                        label="Select Garment"
                        hint="The clothing item to put on the model (PNG, JPG, WebP)"
                        file={garmentFile}
                        onDrop={setGarmentFile}
                      />

                      {/* Dropzone 2 — Model */}
                      <BlockStack gap="400">
                        <DropZoneArea
                          label="Select AI Model or Upload Custom"
                          hint="Upload a custom model photo, or choose a preset below"
                          file={modelFile}
                          onDrop={setModelFile}
                        />
                        <Select
                          label="Model preset"
                          options={MODEL_PRESETS}
                          value={modelPreset}
                          onChange={setModelPreset}
                          disabled={Boolean(modelFile)}
                          helpText={modelFile ? 'Preset disabled — custom model uploaded' : undefined}
                        />
                      </BlockStack>
                    </InlineGrid>

                    {/* Apparel result preview */}
                    {apparelResult && (
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingSm">Result</Text>
                          <img
                            src={apparelResult}
                            alt="Generated try-on result"
                            style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
                          />
                        </BlockStack>
                      </Card>
                    )}

                    {apparelError && (
                      <Banner tone="critical" onDismiss={() => setApparelError(null)}>
                        <Text variant="bodySm">{apparelError}</Text>
                      </Banner>
                    )}

                    {credits < 2 && (
                      <Banner tone="warning">
                        <Text variant="bodySm">You need at least 2 credits to generate. <a href="/shopify/plans">Top up here.</a></Text>
                      </Banner>
                    )}

                    <InlineStack align="end" gap="300" blockAlign="center">
                      <CreditBadge cost={2} />
                      <Button
                        variant="primary"
                        size="large"
                        loading={apparelLoading}
                        disabled={!garmentFile || apparelLoading || credits < 2}
                        onClick={handleApparelGenerate}
                      >
                        Generate Try-On
                      </Button>
                    </InlineStack>
                  </BlockStack>
                )}

                {/* ══════════════════════════════════════════════════════════
                    TAB 2 — Universal Product Studio
                ══════════════════════════════════════════════════════════ */}
                {selectedTab === 1 && (
                  <BlockStack gap="500">
                    <BlockStack gap="100">
                      <Text variant="headingMd">Universal Product Studio</Text>
                      <Text variant="bodySm" tone="subdued">
                        Generate stunning scenes for watches, bags, shoes, or any product — powered by a native multimodal AI.
                      </Text>
                    </BlockStack>

                    {/* Step 1 — Product image */}
                    <DropZoneArea
                      label="Select Product"
                      hint="Upload the product image you want to place in a scene"
                      file={productFile}
                      onDrop={setProductFile}
                    />

                    {/* Step 2 — Intent selector (Progressive Disclosure trigger) */}
                    <Card>
                      <BlockStack gap="300">
                        <Text variant="headingSm">What do you want to create?</Text>
                        <InlineStack gap="600" wrap={false}>
                          <RadioButton
                            label="Place on a Human"
                            helpText="Product worn or held by a person"
                            id="intent-human"
                            name="intent"
                            checked={intent === 'human'}
                            onChange={() => setIntent('human')}
                          />
                          <RadioButton
                            label="Create Environment"
                            helpText="Product in a styled scene or setting"
                            id="intent-environment"
                            name="intent"
                            checked={intent === 'environment'}
                            onChange={() => setIntent('environment')}
                          />
                        </InlineStack>
                      </BlockStack>
                    </Card>

                    {/* Step 3 — Scene description */}
                    <TextField
                      label="Describe the scene"
                      value={scenePrompt}
                      onChange={setScenePrompt}
                      placeholder={
                        intent === 'human'
                          ? 'e.g. A confident woman wearing this jacket on a sunny New York street, candid photography...'
                          : 'e.g. Luxury marble surface with soft bokeh background, golden hour lighting, editorial style...'
                      }
                      multiline={3}
                      autoComplete="off"
                      helpText="The more specific you are, the better the result."
                    />

                    {/* ── Pro Drawer ──────────────────────────────────────── */}
                    <Box borderWidth="025" borderColor="border" borderRadius="300" padding="400">
                      <BlockStack gap="300">
                        <InlineStack align="space-between" blockAlign="center">
                          <BlockStack gap="050">
                            <InlineStack gap="200" blockAlign="center">
                              <Layers size={16} color="var(--p-color-text-secondary, #6d7175)" />
                              <Text variant="headingSm">Pro References</Text>
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued">
                              Guide the AI with style, face, or pose references for precise results.
                            </Text>
                          </BlockStack>
                          <Button
                            onClick={() => setRefsExpanded((v) => !v)}
                            variant={refsExpanded ? 'secondary' : 'primary'}
                            icon={!refsExpanded ? PlusIcon : undefined}
                            size="slim"
                          >
                            {refsExpanded ? 'Hide References' : '+ Add References (Optional)'}
                          </Button>
                        </InlineStack>

                        <Collapsible
                          open={refsExpanded}
                          id="pro-refs-drawer"
                          transition={{ duration: '200ms', timingFunction: 'ease-in-out' }}
                        >
                          <Box paddingBlockStart="400">
                            <BlockStack gap="400">
                              {hasRefs && (
                                <Banner tone="info">
                                  <Text variant="bodySm">
                                    References detected — this generation will cost <strong>4 credits</strong>.
                                  </Text>
                                </Banner>
                              )}
                              <InlineGrid columns={{ xs: 1, sm: 3 }} gap="300">
                                <DropZoneArea
                                  label="Style Reference"
                                  hint="Sets lighting, mood & colour palette"
                                  file={styleRefFile}
                                  onDrop={setStyleRefFile}
                                />
                                <DropZoneArea
                                  label="Face Reference"
                                  hint="Face to use on the human model"
                                  file={faceRefFile}
                                  onDrop={setFaceRefFile}
                                />
                                <DropZoneArea
                                  label="Pose Reference"
                                  hint="Preferred body pose or composition"
                                  file={poseRefFile}
                                  onDrop={setPoseRefFile}
                                />
                              </InlineGrid>
                            </BlockStack>
                          </Box>
                        </Collapsible>
                      </BlockStack>
                    </Box>

                    {/* Universal result preview */}
                    {universalResult && (
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingSm">Result</Text>
                          <img
                            src={universalResult}
                            alt="Generated product scene"
                            style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
                          />
                        </BlockStack>
                      </Card>
                    )}

                    {universalError && (
                      <Banner tone="critical" onDismiss={() => setUniversalError(null)}>
                        <Text variant="bodySm">{universalError}</Text>
                      </Banner>
                    )}

                    {credits < universalCost && (
                      <Banner tone="warning">
                        <Text variant="bodySm">
                          You need at least {universalCost} credits for this generation.{' '}
                          <a href="/shopify/plans">Top up here.</a>
                        </Text>
                      </Banner>
                    )}

                    <InlineStack align="end" gap="300" blockAlign="center">
                      <CreditBadge cost={universalCost} />
                      <Button
                        variant="primary"
                        size="large"
                        loading={universalLoading}
                        disabled={
                          !productFile ||
                          !scenePrompt.trim() ||
                          universalLoading ||
                          credits < universalCost
                        }
                        onClick={handleUniversalGenerate}
                      >
                        Generate Scene
                      </Button>
                    </InlineStack>
                  </BlockStack>
                )}
              </Box>
            </BlockStack>
          </Card>

          {/* ── Results Gallery ───────────────────────────────────────────── */}
          {generations.length > 0 && (
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="100">
                  <Text variant="headingMd">Results Gallery</Text>
                  <Text variant="bodySm" tone="subdued">
                    Your recent AI Studio Pro generations — save any result directly to your product media.
                  </Text>
                </BlockStack>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: 16,
                  }}
                >
                  {generations.map((gen) => (
                    <GalleryItem
                      key={gen.id}
                      generation={gen}
                      isSaving={savingId === gen.id}
                      onSave={handleSaveToShopify}
                    />
                  ))}
                </div>
              </BlockStack>
            </Card>
          )}

        </BlockStack>
      </Page>
    </ShopifyLayout>
  );
}
