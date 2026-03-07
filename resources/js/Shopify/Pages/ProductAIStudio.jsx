import ShopifyLayout from '@/Shopify/Layouts/ShopifyLayout';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  DropZone,
  TextField,
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
  PlusCircleIcon,
  MinusCircleIcon,
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

const INTENT_OPTIONS = [
  { value: 'environment', label: 'Create Environment' },
  { value: 'on_human',    label: 'Place on a Human' },
];

const GALLERY_DATE_OPTIONS = [
  { value: 'all',          label: 'All time' },
  { value: 'today',        label: 'Today' },
  { value: 'last_7_days',  label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
];

const GALLERY_TOOL_OPTIONS = [
  { value: 'all',               label: 'All tools' },
  { value: 'universal_generate', label: 'Product AI Studio' },
];

const PROCESSING_MESSAGES = [
  'Composing scene…', 'Placing product…', 'Engineering light…',
  'Matching environment…', 'Refining composition…', 'Applying style refs…',
  'Polishing edges…', 'Rendering shadows…', 'Harmonising palette…',
  'Final touches…',
];

/* ─────────────────────────────────────────────────────────────────
   Helpers
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

/** Small labelled dropzone used inside the Pro Reference Drawer */
function MiniDropZone({ label, preview, onDrop, onRemove }) {
  return (
    <BlockStack gap="100">
      <Text variant="bodySm" tone="subdued" as="p">{label}</Text>
      {preview ? (
        <BlockStack gap="100">
          <div
            style={{
              borderRadius: 8,
              overflow: 'hidden',
              border: `1px solid var(--p-color-border)`,
              aspectRatio: '1/1',
              background: 'var(--p-color-bg-surface-secondary)',
            }}
          >
            <img src={preview} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <Button variant="plain" size="slim" onClick={onRemove}>Remove</Button>
        </BlockStack>
      ) : (
        <DropZone
          accept="image/*"
          type="image"
          allowMultiple={false}
          onDrop={onDrop}
          label={label}
          labelHidden
        >
          <div style={{ padding: '12px 8px', textAlign: 'center' }}>
            <Text variant="bodySm" tone="subdued" as="p">
              <span style={{ color: TEAL, fontWeight: 500 }}>Upload</span><br />
              <span style={{ fontSize: 11 }}>PNG / JPG</span>
            </Text>
          </div>
        </DropZone>
      )}
    </BlockStack>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────── */
export default function ProductAIStudio({ credits: initialCredits = 0 }) {
  /* ── State ── */
  const [credits, setCredits]                     = useState(() => Math.max(0, parseInt(initialCredits, 10) || 0));
  const [productImage, setProductImage]           = useState(null);
  const [intent, setIntent]                       = useState('environment');
  const [scenePrompt, setScenePrompt]             = useState('');
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

  /* Pro Reference Drawer */
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [styleRef, setStyleRef]         = useState(null);
  const [faceRef, setFaceRef]           = useState(null);
  const [poseRef, setPoseRef]           = useState(null);

  const pollRef   = useRef(null);
  const pollCount = useRef(0);
  const shopifyAppBridge = (typeof window !== 'undefined' && window.shopify) || null;

  /* ── Derived ── */
  const isScanning    = processingStatus === 'uploading' || processingStatus === 'scanning';
  const isDone        = processingStatus === 'done';
  const hasProduct    = Boolean(productImage);
  const hasPrompt     = scenePrompt.trim().length > 0;
  const hasRefs       = Boolean(styleRef || faceRef || poseRef);
  const creditsNeeded = hasRefs ? 4 : 2;
  const canGenerate   = hasProduct && hasPrompt && !isScanning;
  const remainingAfter = Math.max(0, credits - creditsNeeded);
  const processingLabel = PROCESSING_MESSAGES[processingMsgIdx % PROCESSING_MESSAGES.length];

  /* ── Toast ── */
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
      const now     = Date.now();
      const cutoffs = { today: 86400e3, last_7_days: 604800e3, last_30_days: 2592000e3 };
      const cutoff  = now - (cutoffs[galleryDateFilter] || 0);
      list = list.filter((g) => new Date(g.updated_at || g.created_at).getTime() >= cutoff);
    }
    return list;
  }, [recentGenerations, galleryToolFilter, galleryDateFilter]);

  /* ── Scanning animation ── */
  useEffect(() => {
    if (!isScanning) return;
    setProcessingMsgIdx(Math.floor(Math.random() * PROCESSING_MESSAGES.length));
    const id = setInterval(() => setProcessingMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length), 6000);
    return () => clearInterval(id);
  }, [isScanning]);

  /* ── Polling ── */
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
        const res = await axios.get(`/shopify/api/ai-studio/job/${jobId}?tool=universal_generate`);
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
  const handleProductDrop = useCallback((_all, accepted) => {
    const file = accepted[0];
    if (file) setProductImage(URL.createObjectURL(file));
  }, []);

  const makeRefDropHandler = (setter) => (_all, accepted) => {
    const file = accepted[0];
    if (file) setter(URL.createObjectURL(file));
  };

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setProductImage(null);
    setScenePrompt('');
    setResultImageUrl(null);
    setProcessingStatus('idle');
    setJobId(null);
    setGenerationId(null);
    setStyleRef(null);
    setFaceRef(null);
    setPoseRef(null);
    setDrawerOpen(false);
  }, []);

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!hasProduct) { showToast('Please upload or select a product image first.'); return; }
    if (!hasPrompt)  { showToast('Please describe the scene you want to create.'); return; }
    if (credits < creditsNeeded) {
      showToast(`Not enough credits. This action costs ${creditsNeeded} credits.`, true);
      return;
    }
    try {
      setProcessingStatus('uploading');
      const form = new FormData();
      form.append('product_category', 'universal');
      form.append('intent', intent);
      form.append('prompt', scenePrompt);

      const productBlob = await fetch(productImage).then((r) => r.blob());
      form.append('main_image', productBlob, 'product.png');

      const refEntries = [
        ['style_ref', styleRef],
        ['face_ref',  faceRef],
        ['pose_ref',  poseRef],
      ];
      for (const [key, url] of refEntries) {
        if (url) {
          const blob = await fetch(url).then((r) => r.blob());
          form.append(`reference_images[${key}]`, blob, `${key}.png`);
        }
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
      const zip = new JSZip();
      await Promise.all(
        filteredGenerations.map(async (gen, i) => {
          try {
            const blob   = await fetch(gen.result_image_url).then((r) => r.blob());
            const folder = exportType === 'categories' ? `${gen.tool_used || 'uncategorized'}/` : '';
            zip.file(`${folder}masterpiece-${i + 1}.png`, blob);
          } catch { /* skip */ }
        }),
      );
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'product-ai-export.zip');
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
        title="Product AI Studio"
        subtitle="Place any product in stunning environments. Powered by Nano Banana 2."
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
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img src={productImage} alt="" className="premium-scanning-img" />
                        <div className="premium-scanning-badge" aria-live="polite">
                          ✨ {processingLabel}
                        </div>
                      </div>
                    </div>

                  ) : isDone && resultImageUrl ? (
                    <div className="aistudio-output-wrap">
                      <div className="aistudio-output-checkerboard">
                        <img
                          src={resultImageUrl}
                          alt="Generated scene"
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
                              a.download = 'product-ai-studio.png';
                              a.target = '_blank'; a.rel = 'noopener noreferrer';
                              document.body.appendChild(a); a.click(); document.body.removeChild(a);
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
                                const p   = selected[0];
                                const pid = p.admin_graphql_api_id ?? p.id ?? String(p.id);
                                const res = await axios.post('/shopify/assign-to-product', { product_id: pid, generation_id: generationId });
                                if (res.data.success) showToast(res.data.message);
                                else throw new Error(res.data.message);
                              } catch (err) {
                                showToast(err.response?.data?.message || err.message || 'Failed.', true);
                              }
                            }}
                          />
                        </Tooltip>
                      </div>
                    </div>

                  ) : hasProduct ? (
                    /* Product preview while idle */
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img src={productImage} alt="Product" className="premium-scanning-img" />
                        <div
                          className="premium-scanning-badge"
                          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                        >
                          Ready — describe your scene and generate
                        </div>
                      </div>
                    </div>

                  ) : (
                    <div className="aistudio-empty-state">
                      <div className="aistudio-empty-state-icon">
                        <MasterpieceIllustration />
                      </div>
                      <Text as="h2" variant="headingLg">Your product scene awaits</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Upload your product, describe the environment, and let the AI compose it.
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
                  <Text as="h2" variant="headingMd">Product AI Studio</Text>

                  {/* Step 1 – Product */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Step 1 — Select Product</Text>
                    {productImage ? (
                      <BlockStack gap="200">
                        <div className="aistudio-panel-thumb aistudio-panel-thumb-checkerboard" style={{ borderRadius: 8, overflow: 'hidden' }}>
                          <img src={productImage} alt="Product" style={{ width: '100%', display: 'block' }} />
                        </div>
                        <Button variant="plain" size="slim" onClick={() => setProductImage(null)}>
                          Remove product
                        </Button>
                      </BlockStack>
                    ) : (
                      <DropZone
                        accept="image/*"
                        type="image"
                        allowMultiple={false}
                        onDrop={handleProductDrop}
                        label="Select Product"
                        labelHidden
                      >
                        <DropZone.FileUpload
                          actionTitle="Drop or click to upload product"
                          actionHint="PNG, JPG or WebP — max 15 MB"
                        />
                      </DropZone>
                    )}
                  </BlockStack>

                  {/* Step 2 – Intent */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Step 2 — Choose Intent</Text>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 8,
                      }}
                    >
                      {INTENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setIntent(opt.value)}
                          style={{
                            padding: '10px 8px',
                            borderRadius: 8,
                            border: `2px solid ${intent === opt.value ? TEAL : 'var(--p-color-border)'}`,
                            background: intent === opt.value ? `rgba(70,138,154,0.08)` : 'transparent',
                            color: intent === opt.value ? TEAL : 'var(--p-color-text)',
                            fontWeight: intent === opt.value ? 600 : 400,
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            textAlign: 'center',
                            lineHeight: 1.3,
                          }}
                        >
                          {opt.value === 'environment' ? '🌄' : '🧑'}&nbsp;{opt.label}
                        </button>
                      ))}
                    </div>
                    {intent === 'on_human' && (
                      <Text variant="bodySm" tone="subdued" as="p">
                        AI will mask the product and place it on a human model in a natural setting.
                      </Text>
                    )}
                  </BlockStack>

                  {/* Step 3 – Scene description */}
                  <TextField
                    label="Describe the scene"
                    value={scenePrompt}
                    onChange={setScenePrompt}
                    placeholder={
                      intent === 'on_human'
                        ? 'e.g. Young woman in a sunlit café, casual lifestyle look'
                        : 'e.g. Luxury marble surface, warm studio lighting, minimalist background'
                    }
                    multiline={3}
                    autoComplete="off"
                    characterCount={scenePrompt.length}
                    maxLength={600}
                    helpText="Be specific — the AI reads every detail."
                  />

                  {/* Pro Drawer toggle */}
                  <Box>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen((v) => !v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '6px 0',
                        color: TEAL,
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      <Icon source={drawerOpen ? MinusCircleIcon : PlusCircleIcon} />
                      {drawerOpen ? 'Hide References' : '+ Add References (Optional)'}
                      {hasRefs && !drawerOpen && (
                        <span
                          style={{
                            background: ORANGE,
                            color: '#fff',
                            borderRadius: 99,
                            fontSize: 11,
                            padding: '1px 7px',
                            fontWeight: 700,
                          }}
                        >
                          {[styleRef, faceRef, poseRef].filter(Boolean).length} active
                        </span>
                      )}
                    </button>

                    {/* Reference Drawer */}
                    {drawerOpen && (
                      <Box paddingBlockStart="300">
                        <BlockStack gap="300">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Reference images shape the AI's output — all are optional.
                          </Text>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr 1fr',
                              gap: 12,
                              background: 'var(--p-color-bg-surface-secondary)',
                              borderRadius: 10,
                              padding: 12,
                              border: `1px solid var(--p-color-border)`,
                            }}
                          >
                            <MiniDropZone
                              label="Style Ref"
                              preview={styleRef}
                              onDrop={makeRefDropHandler(setStyleRef)}
                              onRemove={() => setStyleRef(null)}
                            />
                            <MiniDropZone
                              label="Face Ref"
                              preview={faceRef}
                              onDrop={makeRefDropHandler(setFaceRef)}
                              onRemove={() => setFaceRef(null)}
                            />
                            <MiniDropZone
                              label="Pose Ref"
                              preview={poseRef}
                              onDrop={makeRefDropHandler(setPoseRef)}
                              onRemove={() => setPoseRef(null)}
                            />
                          </div>
                          {hasRefs && (
                            <Text variant="bodySm" as="p" tone="subdued">
                              References detected — generation cost is{' '}
                              <strong style={{ color: ORANGE }}>4 credits</strong>.
                            </Text>
                          )}
                        </BlockStack>
                      </Box>
                    )}
                  </Box>

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
                          ✨ Generate Scene
                        </MagicButton>
                        <BlockStack gap="100">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Total credits: <strong className="tabular-nums">{credits.toLocaleString()}</strong>
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            This action uses:{' '}
                            <strong className="tabular-nums" style={{ color: hasRefs ? ORANGE : 'inherit' }}>
                              {creditsNeeded} credit{creditsNeeded !== 1 ? 's' : ''}
                            </strong>
                            {hasRefs && <Text as="span" variant="bodySm" tone="subdued"> (refs active)</Text>}
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
                                    if (!shopify?.resourcePicker) { showToast('Open this app from Shopify Admin.', true); return; }
                                    try {
                                      const sel    = await shopify.resourcePicker({ type: 'product', action: 'select', multiple: false });
                                      const items  = Array.isArray(sel) ? sel : (sel?.selection ?? []);
                                      if (!items.length) return;
                                      const p = items[0];
                                      const pid = p.admin_graphql_api_id ?? p.id ?? String(p.id);
                                      const res = await axios.post('/shopify/assign-to-product', { product_id: pid, generation_id: gen.id });
                                      if (res.data.success) showToast(res.data.message);
                                      else throw new Error(res.data.message);
                                    } catch (err) { showToast(err.response?.data?.message || err.message || 'Failed.', true); }
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
