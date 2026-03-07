import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  DropZone,
  Select,
  Button,
  Box,
  Icon,
  Tooltip,
  Modal,
  ChoiceList,
} from '@shopify/polaris';
import {
  ExportIcon,
  ImageIcon,
  ImageMagicIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import MagicButton from '@/Shopify/Components/MagicButton';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const TEAL   = '#468A9A';
const ORANGE = '#FF7A30';
const CREDITS_PER_GENERATION = 2;

const GARMENT_CATEGORY_OPTIONS = [
  { value: 'upper_body', label: 'Upper Body (shirt, jacket, top)' },
  { value: 'lower_body', label: 'Lower Body (pants, skirt)' },
  { value: 'dress',      label: 'Full Dress / Outfit' },
];

const MODEL_PRESET_OPTIONS = [
  { value: 'custom',    label: 'Upload Custom Model Photo' },
  { value: 'female_1',  label: 'Preset: Female – Neutral Studio' },
  { value: 'female_2',  label: 'Preset: Female – Warm Lifestyle' },
  { value: 'male_1',    label: 'Preset: Male – Clean Studio' },
  { value: 'male_2',    label: 'Preset: Male – Outdoor Fashion' },
];

/** Public URLs for preset model photos */
const MODEL_PRESET_URLS = {
  female_1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format',
  female_2: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&auto=format',
  male_1:   'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format',
  male_2:   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format',
};

const GALLERY_DATE_OPTIONS = [
  { value: 'all',         label: 'All time' },
  { value: 'today',       label: 'Today' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_30_days',label: 'Last 30 days' },
];

const GALLERY_TOOL_OPTIONS = [
  { value: 'all',          label: 'All tools' },
  { value: 'fashion_vton', label: 'Fashion AI Lab' },
];

const PROCESSING_MESSAGES = [
  'Draping fabric…', 'Fitting garment…', 'Aligning shoulders…',
  'Blending textures…', 'Refining fit…', 'Calibrating drape…',
  'Rendering fabric folds…', 'Applying lighting…', 'Polishing edges…',
  'Almost runway-ready…',
];

/* ─────────────────────────────────────────────────────────────────
   Helper utilities
───────────────────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60)  return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} minute${m === 1 ? '' : 's'} ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d} day${d === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

function MasterpieceIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="60" cy="60" r="48" stroke={TEAL} strokeWidth="2" strokeOpacity="0.4" fill="none" />
      <circle cx="60" cy="60" r="32" stroke={TEAL} strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
      <path
        d="M60 28v4M60 88v4M28 60h4M88 60h4M42 42l2.8 2.8M75.2 75.2l2.8 2.8M75.2 42l-2.8 2.8M42 75.2l-2.8 2.8"
        stroke={TEAL} strokeWidth="1.5" strokeOpacity="0.6"
      />
      <circle cx="60" cy="60" r="8" fill={TEAL} fillOpacity="0.25" />
      <circle cx="60" cy="60" r="4" fill={TEAL} fillOpacity="0.5" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────── */
export default function FashionAILab({ credits: initialCredits = 0 }) {
  /* ── State ── */
  const [credits, setCredits]                     = useState(() => Math.max(0, parseInt(initialCredits, 10) || 0));
  const [garmentImage, setGarmentImage]           = useState(null);
  const [modelImage, setModelImage]               = useState(null);
  const [modelPreset, setModelPreset]             = useState('custom');
  const [garmentCategory, setGarmentCategory]     = useState('upper_body');
  const [processingStatus, setProcessingStatus]   = useState('idle');
  const [processingMsgIdx, setProcessingMsgIdx]   = useState(0);
  const [resultImageUrl, setResultImageUrl]       = useState(null);
  const [jobId, setJobId]                         = useState(null);
  const [generationId, setGenerationId]           = useState(null);
  const [toast, setToast]                         = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);
  const [gridColumns, setGridColumns]             = useState(4);
  const [galleryToolFilter, setGalleryToolFilter] = useState('all');
  const [galleryDateFilter, setGalleryDateFilter] = useState('all');
  const [exportModalOpen, setExportModalOpen]     = useState(false);
  const [exportType, setExportType]               = useState('flat');
  const [isExporting, setIsExporting]             = useState(false);
  const [galleryLoadedIds, setGalleryLoadedIds]   = useState(() => new Set());

  const pollRef   = useRef(null);
  const pollCount = useRef(0);
  const shopifyAppBridge = (typeof window !== 'undefined' && window.shopify) || null;

  /* ── Derived ── */
  const isScanning     = processingStatus === 'uploading' || processingStatus === 'scanning';
  const isDone         = processingStatus === 'done';
  const hasGarment     = Boolean(garmentImage);
  const hasModel       = Boolean(modelImage) || (modelPreset !== 'custom' && MODEL_PRESET_URLS[modelPreset]);
  const canGenerate    = hasGarment && hasModel && !isScanning;
  const effectiveModel = modelPreset !== 'custom' && MODEL_PRESET_URLS[modelPreset]
    ? MODEL_PRESET_URLS[modelPreset]
    : modelImage;
  const processingLabel = PROCESSING_MESSAGES[processingMsgIdx % PROCESSING_MESSAGES.length];
  const remainingAfter  = Math.max(0, credits - CREDITS_PER_GENERATION);

  /* ── Toast helpers ── */
  const showToast    = useCallback((msg, isError = false) => setToast({ message: msg, isError }), []);
  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast || toast.isError) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Gallery ── */
  const refetchGallery = useCallback(() => {
    axios.get('/shopify/recent-generations')
      .then((res) => { if (res.data?.generations) setRecentGenerations(res.data.generations); })
      .catch(() => {});
  }, []);

  useEffect(() => { refetchGallery(); }, [refetchGallery]);

  const filteredGenerations = useMemo(() => {
    let list = galleryToolFilter === 'all'
      ? recentGenerations
      : recentGenerations.filter((g) => g.tool_used === galleryToolFilter);

    if (galleryDateFilter !== 'all') {
      const now = Date.now();
      const cutoffs = { today: 86400e3, last_7_days: 604800e3, last_30_days: 2592000e3 };
      const cutoff = now - (cutoffs[galleryDateFilter] || 0);
      list = list.filter((g) => new Date(g.updated_at || g.created_at).getTime() >= cutoff);
    }
    return list;
  }, [recentGenerations, galleryToolFilter, galleryDateFilter]);

  /* ── Processing animation rotation ── */
  useEffect(() => {
    if (!isScanning) return;
    setProcessingMsgIdx(Math.floor(Math.random() * PROCESSING_MESSAGES.length));
    const id = setInterval(() => setProcessingMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length), 6000);
    return () => clearInterval(id);
  }, [isScanning]);

  /* ── Polling loop ── */
  useEffect(() => {
    if (processingStatus !== 'scanning' || !jobId) return;
    pollCount.current = 0;

    const poll = async () => {
      if (pollCount.current > 90) {
        setProcessingStatus('error');
        showToast('Generation timed out. Please try again.', true);
        return;
      }
      pollCount.current += 1;
      try {
        const res = await axios.get(`/shopify/api/ai-studio/job/${jobId}?tool=fashion_vton`);
        const data = res.data;
        if (data.credits_remaining != null) setCredits(data.credits_remaining);
        if (data.status === 'done' && data.result_image_url) {
          setResultImageUrl(data.result_image_url);
          if (data.generation_id) setGenerationId(data.generation_id);
          setProcessingStatus('done');
          refetchGallery();
        } else if (data.status === 'error') {
          setProcessingStatus('error');
          showToast(data.message || 'Generation failed.', true);
        } else {
          pollRef.current = setTimeout(poll, 2000);
        }
      } catch {
        setProcessingStatus('error');
        showToast('Connection error while polling.', true);
      }
    };

    pollRef.current = setTimeout(poll, 2000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [processingStatus, jobId]);

  /* ── Dropzone handlers ── */
  const handleGarmentDrop = useCallback((_all, accepted) => {
    const file = accepted[0];
    if (file) setGarmentImage(URL.createObjectURL(file));
  }, []);

  const handleModelDrop = useCallback((_all, accepted) => {
    const file = accepted[0];
    if (file) { setModelImage(URL.createObjectURL(file)); setModelPreset('custom'); }
  }, []);

  const handlePresetChange = useCallback((value) => {
    setModelPreset(value);
    if (value !== 'custom') setModelImage(null);
  }, []);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setGarmentImage(null);
    setModelImage(null);
    setModelPreset('custom');
    setResultImageUrl(null);
    setProcessingStatus('idle');
    setJobId(null);
    setGenerationId(null);
  }, []);

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!canGenerate) {
      showToast('Please upload a garment and select or upload a model photo first.');
      return;
    }
    if (credits < CREDITS_PER_GENERATION) {
      showToast(`Not enough credits. This action costs ${CREDITS_PER_GENERATION} credits.`, true);
      return;
    }

    try {
      setProcessingStatus('uploading');
      const form = new FormData();
      form.append('product_category', 'apparel');
      form.append('garment_category', garmentCategory);

      if (garmentImage) {
        const garmentBlob = await fetch(garmentImage).then((r) => r.blob());
        form.append('main_image', garmentBlob, 'garment.png');
      }

      if (modelPreset !== 'custom' && MODEL_PRESET_URLS[modelPreset]) {
        form.append('human_image_url', MODEL_PRESET_URLS[modelPreset]);
      } else if (modelImage) {
        const modelBlob = await fetch(modelImage).then((r) => r.blob());
        form.append('human_image', modelBlob, 'model.png');
      }

      setProcessingStatus('scanning');
      const res = await axios.post('/shopify/api/ai-studio/generate', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;

      if (data.credits_remaining != null) setCredits(data.credits_remaining);

      if (data.status === 'done' && data.result_image_url) {
        setResultImageUrl(data.result_image_url);
        if (data.generation_id) setGenerationId(data.generation_id);
        setProcessingStatus('done');
        refetchGallery();
      } else if (data.job_id) {
        setJobId(data.job_id);
        if (data.generation_id) setGenerationId(data.generation_id);
        // polling loop picks up when processingStatus==='scanning' and jobId is set
      } else {
        setProcessingStatus('error');
        showToast(data.message || 'Something went wrong.', true);
      }
    } catch (err) {
      setProcessingStatus('error');
      showToast(err.response?.data?.message || 'Generation failed. Please try again.', true);
    }
  };

  /* ── Export ── */
  const handleExportZip = useCallback(async () => {
    if (!filteredGenerations.length) { setExportModalOpen(false); return; }
    setIsExporting(true);
    showToast(`Gathering ${filteredGenerations.length} images for export...`);
    try {
      const zip  = new JSZip();
      await Promise.all(
        filteredGenerations.map(async (gen, i) => {
          try {
            const blob = await fetch(gen.result_image_url).then((r) => r.blob());
            const folder = exportType === 'categories' ? `${gen.tool_used || 'uncategorized'}/` : '';
            zip.file(`${folder}masterpiece-${i + 1}.png`, blob);
          } catch { /* skip */ }
        }),
      );
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'fashion-ai-export.zip');
      showToast('Export successful!');
      setExportModalOpen(false);
    } catch { showToast('Failed to create export ZIP', true); }
    finally { setIsExporting(false); }
  }, [filteredGenerations, exportType, showToast]);

  /* ─────────────────────────────────────────────────────────────
     JSX
  ───────────────────────────────────────────────────────────── */
  return (
    <ShopifyLayout>
      <Page
        title="Fashion AI Lab"
        subtitle="Virtual try-on for apparel and garments. Powered by IDM-VTON."
      >
        <BlockStack gap="400">
          {/* Toast */}
          {toast && createPortal(
            <div
              className={`premium-toast ${toast.isError ? 'premium-toast--error' : 'premium-toast--success'}`}
              role={toast.isError ? 'alert' : 'status'}
              aria-live={toast.isError ? 'assertive' : 'polite'}
            >
              <span className="premium-toast__message">{toast.message}</span>
              {toast.isError && (
                <Button variant="plain" tone="inherit" size="slim" onClick={dismissToast} accessibilityLabel="Dismiss">
                  Dismiss
                </Button>
              )}
            </div>,
            document.body,
          )}

          <Layout>
            {/* ── Hero Canvas (left) ── */}
            <Layout.Section>
              <Card padding="0" className="aistudio-hero-card">
                <div className={`aistudio-hero-canvas${isScanning ? ' aistudio-hero-canvas--processing' : ''}`}>

                  {isScanning ? (
                    /* Scanning animation */
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img
                          src={garmentImage}
                          alt=""
                          className="premium-scanning-img"
                        />
                        <div className="premium-scanning-badge" aria-live="polite">
                          ✨ {processingLabel}
                        </div>
                      </div>
                    </div>

                  ) : isDone && resultImageUrl ? (
                    /* Output image */
                    <div className="aistudio-output-wrap">
                      <div className="aistudio-output-checkerboard">
                        <img
                          src={resultImageUrl}
                          alt="Generated try-on"
                          className="aistudio-output-img"
                        />
                      </div>
                      <div className="aistudio-output-actions">
                        <Tooltip content="Download">
                          <Button
                            icon={ExportIcon}
                            accessibilityLabel="Download"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = resultImageUrl;
                              a.download = 'fashion-ai-lab.png';
                              a.target = '_blank';
                              a.rel = 'noopener noreferrer';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              showToast('Download started');
                            }}
                          />
                        </Tooltip>
                        <Tooltip content="Save to Shopify Product Media">
                          <Button
                            icon={ImageIcon}
                            accessibilityLabel="Save to Shopify Product Media"
                            onClick={async () => {
                              const shopify = shopifyAppBridge;
                              if (!shopify?.resourcePicker) {
                                showToast('Open this app from Shopify Admin to use Save to Product.', true);
                                return;
                              }
                              try {
                                const selection = await shopify.resourcePicker({ type: 'product', action: 'select', multiple: false });
                                const selected  = Array.isArray(selection) ? selection : (selection?.selection ?? []);
                                if (!selected.length) return;
                                const product   = selected[0];
                                const productId = product.admin_graphql_api_id ?? product.id ?? String(product.id);
                                const res = await axios.post('/shopify/assign-to-product', { product_id: productId, generation_id: generationId });
                                if (res.data.success) showToast(res.data.message);
                                else throw new Error(res.data.message);
                              } catch (err) {
                                showToast(err.response?.data?.message || err.message || 'Failed to add to product.', true);
                              }
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>

                  ) : (
                    /* Empty state */
                    <div className="aistudio-empty-state">
                      <div className="aistudio-empty-state-icon">
                        <MasterpieceIllustration />
                      </div>
                      <Text as="h2" variant="headingLg">Your fashion visual awaits</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Upload a garment and select a model, then click Generate.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>

            {/* ── Command Center (right) ── */}
            <Layout.Section variant="oneThird">
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Fashion AI Lab</Text>

                  {/* Garment Dropzone */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Step 1 — Select Garment
                    </Text>
                    {garmentImage ? (
                      <BlockStack gap="200">
                        <div className="aistudio-panel-thumb aistudio-panel-thumb-checkerboard" style={{ position: 'relative' }}>
                          <img src={garmentImage} alt="Garment" style={{ width: '100%', display: 'block', borderRadius: 8 }} />
                        </div>
                        <Button
                          variant="plain"
                          size="slim"
                          onClick={() => setGarmentImage(null)}
                        >
                          Remove garment
                        </Button>
                      </BlockStack>
                    ) : (
                      <DropZone
                        accept="image/*"
                        type="image"
                        allowMultiple={false}
                        onDrop={handleGarmentDrop}
                        label="Select Garment"
                        labelHidden
                      >
                        <DropZone.FileUpload
                          actionTitle="Drop or click to upload garment"
                          actionHint="PNG or JPG, max 15 MB"
                        />
                      </DropZone>
                    )}
                  </BlockStack>

                  {/* Garment category */}
                  <Select
                    label="Garment category"
                    options={GARMENT_CATEGORY_OPTIONS}
                    value={garmentCategory}
                    onChange={setGarmentCategory}
                    helpText="Helps the AI position the garment correctly."
                  />

                  {/* Model preset or custom upload */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Step 2 — Select AI Model or Upload Custom
                    </Text>
                    <Select
                      label="Model preset"
                      labelHidden
                      options={MODEL_PRESET_OPTIONS}
                      value={modelPreset}
                      onChange={handlePresetChange}
                    />
                    {modelPreset !== 'custom' && MODEL_PRESET_URLS[modelPreset] ? (
                      <div className="aistudio-panel-thumb" style={{ borderRadius: 8, overflow: 'hidden' }}>
                        <img
                          src={MODEL_PRESET_URLS[modelPreset]}
                          alt="Preset model"
                          style={{ width: '100%', display: 'block' }}
                        />
                      </div>
                    ) : (
                      modelImage ? (
                        <BlockStack gap="200">
                          <div className="aistudio-panel-thumb" style={{ borderRadius: 8, overflow: 'hidden' }}>
                            <img src={modelImage} alt="Custom model" style={{ width: '100%', display: 'block' }} />
                          </div>
                          <Button variant="plain" size="slim" onClick={() => setModelImage(null)}>
                            Remove model photo
                          </Button>
                        </BlockStack>
                      ) : (
                        <DropZone
                          accept="image/*"
                          type="image"
                          allowMultiple={false}
                          onDrop={handleModelDrop}
                          label="Upload custom model photo"
                          labelHidden
                        >
                          <DropZone.FileUpload
                            actionTitle="Drop or click to upload model photo"
                            actionHint="Portrait with clear body — PNG or JPG"
                          />
                        </DropZone>
                      )
                    )}
                  </BlockStack>

                  {/* Source thumbnails mini-preview */}
                  {(garmentImage || effectiveModel) && (
                    <div className="aistudio-panel-source-output">
                      {garmentImage && (
                        <div className="aistudio-panel-thumb aistudio-panel-thumb-checkerboard">
                          <img src={garmentImage} alt="Garment" />
                        </div>
                      )}
                      {effectiveModel && (
                        <div className="aistudio-panel-thumb">
                          <img src={effectiveModel} alt="Model" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generate / Reset */}
                  <Box paddingBlockStart="200">
                    {isDone && resultImageUrl ? (
                      <Button fullWidth variant="secondary" size="large" onClick={handleReset}>
                        Start New Generation
                      </Button>
                    ) : (
                      <BlockStack gap="200">
                        <MagicButton
                          fullWidth
                          size="large"
                          onClick={handleGenerate}
                          loading={isScanning}
                          disabled={!canGenerate || isScanning}
                        >
                          ✨ Generate Try-On
                        </MagicButton>
                        <BlockStack gap="100">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Total credits: <strong className="tabular-nums">{credits.toLocaleString()}</strong>
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            This action uses: <strong className="tabular-nums">{CREDITS_PER_GENERATION} credits</strong>
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Remaining after: <strong className="tabular-nums">{remainingAfter.toLocaleString()}</strong>
                          </Text>
                        </BlockStack>
                      </BlockStack>
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>

          {/* ── Recent Masterpieces Gallery ── */}
          <Box paddingBlockStart="600">
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center" wrap gap="400">
                  <Text as="h2" variant="headingMd">Recent Masterpieces</Text>
                  <InlineStack gap="300" blockAlign="center" wrap>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Date:</Text>
                      <Select label="" labelHidden options={GALLERY_DATE_OPTIONS} value={galleryDateFilter} onChange={setGalleryDateFilter} />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Tool:</Text>
                      <Select label="" labelHidden options={GALLERY_TOOL_OPTIONS} value={galleryToolFilter} onChange={setGalleryToolFilter} />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Text as="span" variant="bodySm" tone="subdued">Grid:</Text>
                      <Select
                        label="" labelHidden
                        options={[
                          { value: '3', label: '3 columns' },
                          { value: '4', label: '4 columns' },
                          { value: '5', label: '5 columns' },
                          { value: '6', label: '6 columns' },
                        ]}
                        value={String(gridColumns)}
                        onChange={(v) => setGridColumns(Number(v))}
                      />
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Button icon={ExportIcon} onClick={() => setExportModalOpen(true)}>Export</Button>
                    </InlineStack>
                  </InlineStack>
                </InlineStack>

                {filteredGenerations.length === 0 ? (
                  <div className="aistudio-gallery-empty">
                    <div className="aistudio-gallery-empty-icon" aria-hidden>
                      <Icon source={ImageMagicIcon} tone="subdued" />
                    </div>
                    <Text as="h3" variant="headingMd">
                      {recentGenerations.length === 0
                        ? 'Your gallery will appear here'
                        : `No creations for ${GALLERY_TOOL_OPTIONS.find((o) => o.value === galleryToolFilter)?.label ?? 'this filter'}`}
                    </Text>
                  </div>
                ) : (
                  <div
                    className="aistudio-gallery aistudio-gallery--masonry"
                    style={{ ['--gallery-columns']: gridColumns }}
                  >
                    {filteredGenerations.map((gen) => (
                      <div key={gen.id} className="aistudio-gallery-card">
                        <div className={`aistudio-gallery-card-image-wrap${galleryLoadedIds.has(gen.id) ? ' is-loaded' : ''}`}>
                          <div className="aistudio-gallery-card-checkerboard">
                            <div className="aistudio-gallery-card-skeleton" aria-hidden="true" />
                            <img
                              src={gen.result_image_url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              onLoad={() => setGalleryLoadedIds((prev) => new Set(prev).add(gen.id))}
                              onError={(e) => {
                                const img = e.target;
                                const src = img?.src || gen.result_image_url;
                                let path = src;
                                try { if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname; } catch { /* ignore */ }
                                if (path?.startsWith('/storage/') && typeof window !== 'undefined') {
                                  img.src = window.location.origin + path;
                                }
                              }}
                            />
                          </div>
                          <div className="aistudio-gallery-card-overlay">
                            <InlineStack gap="200" blockAlign="center">
                              <Tooltip content="Download">
                                <Button
                                  size="slim" icon={ExportIcon} accessibilityLabel="Download"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = gen.result_image_url;
                                    a.download = 'masterpiece.png';
                                    a.target = '_blank'; a.rel = 'noopener noreferrer';
                                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                    showToast('Download started');
                                    axios.post('/shopify/tools/generation/downloaded', { generation_id: gen.id }).catch(() => {});
                                  }}
                                />
                              </Tooltip>
                              <Tooltip content="Save to Shopify Product Media">
                                <Button
                                  size="slim" icon={ImageIcon} accessibilityLabel="Save to Shopify Product Media"
                                  onClick={async () => {
                                    const shopify = shopifyAppBridge;
                                    if (!shopify?.resourcePicker) { showToast('Open this app from Shopify Admin to use Save to Product.', true); return; }
                                    try {
                                      const selection = await shopify.resourcePicker({ type: 'product', action: 'select', multiple: false });
                                      const selected  = Array.isArray(selection) ? selection : (selection?.selection ?? []);
                                      if (!selected.length) return;
                                      const p = selected[0];
                                      const pid = p.admin_graphql_api_id ?? p.id ?? String(p.id);
                                      const res = await axios.post('/shopify/assign-to-product', { product_id: pid, generation_id: gen.id });
                                      if (res.data.success) showToast(res.data.message);
                                      else throw new Error(res.data.message);
                                    } catch (err) { showToast(err.response?.data?.message || err.message || 'Failed to add to product.', true); }
                                  }}
                                />
                              </Tooltip>
                            </InlineStack>
                          </div>
                        </div>
                        <div className="aistudio-gallery-card-meta">
                          <Text as="span" variant="bodySm" tone="subdued">{timeAgo(gen.updated_at || gen.created_at)}</Text>
                          {gen.shopify_product_id && <Text as="span" variant="bodySm" tone="subdued">{' · '}On product</Text>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlockStack>
            </Card>
          </Box>

          {/* ── Export Modal ── */}
          <Modal
            open={exportModalOpen}
            onClose={() => !isExporting && setExportModalOpen(false)}
            title="Export Your Masterpieces"
            primaryAction={{
              content: isExporting ? 'Creating ZIP…' : 'Export',
              onAction: handleExportZip,
              loading: isExporting,
              disabled: isExporting || filteredGenerations.length === 0,
            }}
            secondaryActions={[{
              content: 'Cancel',
              onAction: () => !isExporting && setExportModalOpen(false),
              disabled: isExporting,
            }]}
          >
            <Modal.Section>
              <ChoiceList
                title="Export format"
                choices={[
                  { label: 'All in one folder (flat)', value: 'flat' },
                  { label: 'Organised by tool (folders)', value: 'categories' },
                ]}
                selected={[exportType]}
                onChange={([v]) => setExportType(v)}
              />
              <Box paddingBlockStart="400">
                <Text variant="bodySm" tone="subdued" as="p">
                  {filteredGenerations.length} image{filteredGenerations.length !== 1 ? 's' : ''} will be included
                  based on your current filters.
                </Text>
              </Box>
            </Modal.Section>
          </Modal>
        </BlockStack>
      </Page>
    </ShopifyLayout>
  );
}
