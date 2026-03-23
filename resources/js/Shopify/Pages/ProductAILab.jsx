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
} from '@shopify/polaris';
import {
  ArrowRightIcon,
  ExportIcon,
  ImageIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TitleBar } from '@shopify/app-bridge-react';
import axios from 'axios';

import MagicButton from '@/Shopify/Components/MagicButton';
import BrowseFromStore from '@/Shopify/Components/BrowseFromStore';
import GenerationsGallery from '@/Shopify/Components/GenerationsGallery';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const TEAL   = '#468A9A';
const ORANGE = '#FF7A30';

const GALLERY_TOOL_OPTIONS = [
  { value: 'all',               label: 'All tools' },
  { value: 'universal_generate', label: 'Product AI Lab (VTO)' },
];

const PROCESSING_MESSAGES = [
  'Composing scene…', 'Placing product…', 'Engineering light…',
  'Matching environment…', 'Refining composition…', 'Applying style refs…',
  'Polishing edges…', 'Rendering shadows…', 'Harmonising palette…',
  'Final touches…',
];

/** Resolve extra credit cost from resolution value */
function resolutionExtraCredits(resolution, resolutionOptions = []) {
  const opt = resolutionOptions.find((o) => o.value === resolution);
  return opt ? opt.extraCredits : 0;
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

/** Compact pill button used for aspect ratio + resolution selectors */
function PillButton({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '7px 10px',
        borderRadius: 8,
        border: `2px solid ${selected ? TEAL : 'var(--p-color-border)'}`,
        background: selected ? `rgba(70,138,154,0.08)` : 'transparent',
        color: selected ? TEAL : 'var(--p-color-text)',
        fontWeight: selected ? 600 : 400,
        fontSize: 12,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

/** Small labelled dropzone used inside the Pro Reference Drawer */
function MiniDropZone({ label, preview, onDrop, onRemove }) {
  return (
    <BlockStack gap="100">
      {label && <Text variant="bodySm" tone="subdued" as="p">{label}</Text>}
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
export default function ProductAILab({ credits: initialCredits = 0, nanoBanana = {} }) {
  const featureFlags = nanoBanana?.features || {};
  const defaultConfig = nanoBanana?.defaults || {};

  // Fallback aspect ratios if not provided from admin
  const FALLBACK_ASPECT_RATIOS = [
    { value: '1:1', label: '1:1' },
    { value: '4:3', label: '4:3' },
    { value: '3:4', label: '3:4' },
    { value: '16:9', label: '16:9' },
    { value: '9:16', label: '9:16' },
  ];

  const aspectRatioOptions = nanoBanana?.aspectRatios && nanoBanana.aspectRatios.length > 0
    ? nanoBanana.aspectRatios
    : FALLBACK_ASPECT_RATIOS;

  // Get dynamic resolution credit costs from admin configuration
  const resolutionCredits = nanoBanana?.resolutionCredits || {
    '1K': 0,
    '2K': 1,
    '4K': 3,
  };

  // Build dynamic resolution options with admin-configured credit costs
  const RESOLUTION_OPTIONS = [
    { value: '1K', label: '1K', hint: 'Standard',   extraCredits: resolutionCredits['1K'] ?? 0 },
    { value: '2K', label: '2K', hint: 'HD',         extraCredits: resolutionCredits['2K'] ?? 1 },
    { value: '4K', label: '4K', hint: 'Ultra HD',   extraCredits: resolutionCredits['4K'] ?? 3 },
  ];

  // Validate default aspect ratio is in the enabled list
  const defaultAspect = aspectRatioOptions.some((o) => o.value === defaultConfig.aspect_ratio)
    ? defaultConfig.aspect_ratio
    : (aspectRatioOptions[0]?.value ?? '1:1');

  const defaultResolution = RESOLUTION_OPTIONS.some((o) => o.value === defaultConfig.resolution)
    ? defaultConfig.resolution
    : '1K';

  const googleSearchAvailable = !!featureFlags.google_search;
  const imageSearchAvailable = !!featureFlags.image_search;

  /* ── State ── */
  const [credits, setCredits]                     = useState(() => Math.max(0, parseInt(initialCredits, 10) || 0));
  const [productImage, setProductImage]           = useState(null);
  const [aspectRatio, setAspectRatio]             = useState(defaultAspect);
  const [resolution, setResolution]               = useState(defaultResolution);
  const [scenePrompt, setScenePrompt]             = useState('');
  const [googleSearchEnabled, setGoogleSearchEnabled] = useState(false);
  const [imageSearchEnabled, setImageSearchEnabled] = useState(false);
  const [processingStatus, setProcessingStatus]   = useState('idle');
  const [processingMsgIdx, setProcessingMsgIdx]   = useState(0);
  const [resultImageUrl, setResultImageUrl]       = useState(null);
  const [jobId, setJobId]                         = useState(null);
  const [generationId, setGenerationId]           = useState(null);
  const [toast, setToast]                         = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);

  const [browseModalOpen, setBrowseModalOpen]     = useState(false);
  /* Pro Reference Drawer */
  const referenceTypes = nanoBanana?.references || [];
  const [referenceStates, setReferenceStates] = useState(() => {
    const initial = {};
    referenceTypes.forEach(rt => {
      initial[rt.slug] = null;
    });
    return initial;
  });
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const pollRef   = useRef(null);
  const pollCount = useRef(0);

  const shopifyAppBridge = (typeof window !== 'undefined' && window.shopify) || null;
  /* ── Derived ── */
  const isScanning     = processingStatus === 'uploading' || processingStatus === 'scanning';
  const isDone         = processingStatus === 'done';
  const hasProduct     = Boolean(productImage);
  const hasPrompt      = scenePrompt.trim().length > 0;
  const hasRefs        = Object.values(referenceStates).some(v => v !== null);
  const hasSearchGrounding = (googleSearchAvailable && googleSearchEnabled) || (imageSearchAvailable && imageSearchEnabled);
  const creditsNeeded  = 2 + resolutionExtraCredits(resolution, RESOLUTION_OPTIONS) + (hasRefs ? 2 : 0);
  const canGenerate    = hasProduct && hasPrompt && !isScanning;
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
    let networkErrorCount = 0;
    const MAX_NETWORK_RETRIES = 3;
    
    const poll = async () => {
      if (pollCount.current > 90) {
        setProcessingStatus('error');
        showToast('Generation timed out. Please try again.', true);
        return;
      }
      pollCount.current += 1;
      try {
        const res = await axios.get(`/shopify/api/ai-studio/job/${jobId}`, {
          timeout: 10000, // 10 second timeout per request
        });
        const data = res.data;
        // Reset network error count on successful request
        networkErrorCount = 0;
        
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
          // Still processing, schedule next poll
          pollRef.current = setTimeout(poll, 2000);
        }
      } catch (err) {
        // Check if error is retriable (network-related)
        const isNetworkError = 
          !err.response || // No response (timeout, DNS, connection reset)
          err.code === 'ECONNABORTED' ||
          err.code === 'ENOTFOUND' ||
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT';
        
        if (isNetworkError && networkErrorCount < MAX_NETWORK_RETRIES) {
          // Network error: retry with exponential backoff
          networkErrorCount += 1;
          const backoffMs = Math.min(2000 * Math.pow(2, networkErrorCount - 1), 8000);
          console.warn(`Poll network error (attempt ${networkErrorCount}/${MAX_NETWORK_RETRIES}), retrying in ${backoffMs}ms`, err.message);
          pollRef.current = setTimeout(poll, backoffMs);
        } else {
          // Either non-network error or max retries exceeded
          setProcessingStatus('error');
          if (isNetworkError && networkErrorCount >= MAX_NETWORK_RETRIES) {
            showToast('Connection lost during generation. Please check the gallery after reload.', true);
          } else {
            showToast('Error checking generation status. Please reload.', true);
          }
        }
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

  const makeRefDropHandler = useCallback((setRef) => {
    return (_all, accepted) => {
      const file = accepted[0];
      if (file) setRef(URL.createObjectURL(file));
    };
  }, []);

  const handleBrowseSelectImage = useCallback((url) => {
    setProductImage(url);
    setBrowseModalOpen(false);
    showToast('Image selected');
  }, [showToast]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setProductImage(null);
    setScenePrompt('');
    setResultImageUrl(null);
    setProcessingStatus('idle');
    setJobId(null);
    setGenerationId(null);
    setReferenceStates(prev => {
      const reset = {};
      Object.keys(prev).forEach(key => { reset[key] = null; });
      return reset;
    });
    setGoogleSearchEnabled(false);
    setImageSearchEnabled(false);
    setDrawerOpen(false);
  }, []);

  /* ── Generate ── */
  const handleGenerate = async () => {
    if (!hasProduct) { showToast('Please upload a product image first.'); return; }
    if (!hasPrompt)  { showToast('Please describe the scene you want to create.'); return; }
    if (credits < creditsNeeded) {
      showToast(`Not enough credits. This action costs ${creditsNeeded} credits.`, true);
      return;
    }
    try {
      setProcessingStatus('uploading');
      const form = new FormData();
      form.append('product_category', 'universal');
      form.append('prompt', scenePrompt);
      form.append('aspect_ratio', aspectRatio);
      form.append('resolution', resolution);
      form.append('output_format', defaultConfig.output_format || 'jpg');
      form.append('google_search', googleSearchAvailable && googleSearchEnabled ? '1' : '0');
      form.append('image_search', imageSearchAvailable && imageSearchEnabled ? '1' : '0');

      const productBlob = await fetch(productImage).then((r) => r.blob());
      form.append('main_image', productBlob, 'product.png');

      // Append reference images dynamically based on admin configuration
      for (const [refSlug, refUrl] of Object.entries(referenceStates)) {
        if (refUrl) {
          const blob = await fetch(refUrl).then((r) => r.blob());
          form.append(`reference_images[${refSlug}]`, blob, `${refSlug}.png`);
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

  /* ─────────────────────────────────────────────────────────────
     JSX
  ───────────────────────────────────────────────────────────── */
  return (
    <ShopifyLayout>
      <TitleBar title="Product AI Lab" />
      <Page
        title="Product AI Lab (VTO)"
        subtitle="Turn product shots into scroll-stopping imagery — no studio, no models, just results that sell."
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
            {/* ──────────────────────────────────────────────────────
                Output Window (left) — pure output, no input preview
            ────────────────────────────────────────────────────── */}
            <Layout.Section>
              <Card padding="0" className="aistudio-hero-card">
                <div className={`aistudio-hero-canvas${isScanning ? ' aistudio-hero-canvas--processing' : ''}`}>

                  {isScanning ? (
                    /* Scanning animation — shows the product as backdrop */
                    <div className="aistudio-scanning">
                      <div className="premium-scanning-wrapper">
                        <img src={productImage} alt="Product image being processed" className="premium-scanning-img" />
                        <div className="premium-scanning-badge" aria-live="polite">
                          ✨ {processingLabel}
                        </div>
                      </div>
                    </div>

                  ) : isDone && resultImageUrl ? (
                    /* Result */
                    <div className="aistudio-hero-result-container">
                      <div className="aistudio-hero-result-wrap">
                        <div className="aistudio-result-checkerboard aistudio-result-image-wrap">
                          <img
                            src={resultImageUrl}
                            alt="Generated scene"
                            className="aistudio-hero-result-img"
                            onError={(e) => {
                              const img = e.target;
                              const src = img?.src || resultImageUrl;
                              let path = src;
                              try { if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname; } catch { /* ignore */ }
                              if (path?.startsWith('/storage/') && typeof window !== 'undefined') {
                                img.src = window.location.origin + path;
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="aistudio-hero-actions aistudio-hero-actions--outside">
                        <InlineStack gap="300">
                          <Button
                            variant="primary"
                            size="medium"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = resultImageUrl;
                              a.download = 'product-ai-lab.png';
                              a.target = '_blank'; a.rel = 'noopener noreferrer';
                              document.body.appendChild(a); a.click(); document.body.removeChild(a);
                              showToast('Download started');
                              if (generationId) {
                                axios.post('/shopify/tools/generation/downloaded', { generation_id: generationId }).catch(() => {});
                              }
                            }}
                          >
                            Download
                          </Button>
                          <Button
                            variant="secondary"
                            size="medium"
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
                          >
                            Save to Product
                          </Button>
                        </InlineStack>
                      </div>
                    </div>

                  ) : productImage ? (
                    /* Preview — product selected, waiting for generate */
                    <div className="aistudio-hero-preview">
                      <img
                        src={productImage}
                        alt="Product preview"
                        className="aistudio-hero-preview-img"
                      />
                    </div>

                  ) : (
                    /* Empty state */
                    <div className="aistudio-hero-empty">
                      <div className="aistudio-hero-empty-illustration">
                        <MasterpieceIllustration />
                      </div>
                      <Text as="h2" variant="headingLg">Your product scene awaits</Text>
                      <Text as="p" variant="bodyMd" tone="subdued">
                        Upload your product, describe the scene you want — lifestyle, on-model, or custom background — and get pro-quality imagery in minutes. No studio needed.
                      </Text>
                    </div>
                  )}
                </div>
              </Card>
            </Layout.Section>

            {/* ──────────────────────────────────────────────────────
                Control Panel (right)
            ────────────────────────────────────────────────────── */}
            <Layout.Section variant="oneThird">
              <div
                style={{
                  pointerEvents: isScanning ? 'none' : undefined,
                  opacity: isScanning ? 0.5 : undefined,
                  transition: 'opacity 0.2s',
                }}
              >
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">Create scenes that sell</Text>

                  {/* Step 1 – Select Product */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Select Product</Text>
                    {productImage ? (
                      <BlockStack gap="200">
                        {isDone && resultImageUrl ? (
                          <div className="aistudio-panel-source-output">
                            <div className="aistudio-panel-thumb aistudio-panel-thumb-checkerboard">
                              <img src={productImage} alt="Source" style={{ width: '100%', display: 'block' }} />
                            </div>
                            <span className="aistudio-panel-arrow" aria-hidden>
                              <Icon source={ArrowRightIcon} tone="subdued" />
                            </span>
                            <div className="aistudio-panel-thumb aistudio-panel-thumb-output aistudio-panel-thumb-checkerboard">
                              <img src={resultImageUrl} alt="Output" style={{ width: '100%', display: 'block' }} />
                            </div>
                          </div>
                        ) : (
                          <div className="aistudio-panel-thumb aistudio-panel-thumb-checkerboard" style={{ borderRadius: 8, overflow: 'hidden' }}>
                            <img src={productImage} alt="Product" style={{ width: '100%', display: 'block' }} />
                          </div>
                        )}
                        <Button variant="plain" size="slim" onClick={() => setProductImage(null)}>
                          Remove product
                        </Button>
                      </BlockStack>
                    ) : (
                      <BlockStack gap="200">
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
                        <Button variant="plain" size="slim" fullWidth onClick={() => setBrowseModalOpen(true)}>
                          Browse from Store
                        </Button>
                      </BlockStack>
                    )}
                  </BlockStack>

                  {/* Step 2 – Aspect Ratio */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Aspect Ratio</Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {aspectRatioOptions.map((opt) => (
                        <PillButton
                          key={opt.value}
                          selected={aspectRatio === opt.value}
                          onClick={() => setAspectRatio(opt.value)}
                        >
                          {opt.label}
                        </PillButton>
                      ))}
                    </div>
                  </BlockStack>

                  {/* Step 3 – Resolution */}
                  <BlockStack gap="200">
                    <Text variant="bodySm" tone="subdued" as="p">Resolution</Text>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                      {RESOLUTION_OPTIONS.map((opt) => (
                        <PillButton
                          key={opt.value}
                          selected={resolution === opt.value}
                          onClick={() => setResolution(opt.value)}
                        >
                          <span style={{ fontWeight: 700 }}>{opt.label}</span>
                          <br />
                          <span style={{ fontSize: 10, opacity: 0.75 }}>{opt.hint}</span>
                          {opt.extraCredits > 0 && (
                            <>
                              <br />
                              <span style={{ fontSize: 10, color: ORANGE }}>+{opt.extraCredits} cr</span>
                            </>
                          )}
                        </PillButton>
                      ))}
                    </div>
                  </BlockStack>

                  {/* Step 4 – Preferences */}
                  <Box>
                    <Text variant="bodySm" tone="subdued" as="p">Preferences</Text>
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
                      {drawerOpen ? 'Hide Preferences' : '+ Add Preferences (Optional)'}
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
                          {Object.values(referenceStates).filter(Boolean).length} active
                        </span>
                      )}
                    </button>

                    {drawerOpen && (
                      <Box paddingBlockStart="300">
                        <BlockStack gap="300">
                          {(googleSearchAvailable || imageSearchAvailable) && (
                            <BlockStack gap="200">
                              <Text variant="bodySm" tone="subdued" as="p">
                                Grounding Options
                              </Text>
                              {googleSearchAvailable && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--p-color-text)' }}>
                                  <input
                                    type="checkbox"
                                    checked={googleSearchEnabled}
                                    onChange={(e) => setGoogleSearchEnabled(e.target.checked)}
                                  />
                                  Enable Google Search grounding (+50% API cost)
                                </label>
                              )}
                              {imageSearchAvailable && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--p-color-text)' }}>
                                  <input
                                    type="checkbox"
                                    checked={imageSearchEnabled}
                                    onChange={(e) => setImageSearchEnabled(e.target.checked)}
                                  />
                                  Enable Image Search grounding (+50% API cost)
                                </label>
                              )}
                            </BlockStack>
                          )}

                          <Text variant="bodySm" tone="subdued" as="p">
                            Reference images shape the AI's output — all are optional. Adding references costs +2 credits.
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
                            {referenceTypes.map((refType) => (
                              <BlockStack key={refType.slug} gap="100">
                                <Text variant="bodySm" as="p" tone="subdued">
                                  {refType.name}
                                </Text>
                                <MiniDropZone
                                  label=""
                                  preview={referenceStates[refType.slug]}
                                  onDrop={(_all, accepted) => {
                                    const file = accepted[0];
                                    if (file) {
                                      setReferenceStates(prev => ({
                                        ...prev,
                                        [refType.slug]: URL.createObjectURL(file)
                                      }));
                                    }
                                  }}
                                  onRemove={() => setReferenceStates(prev => ({ ...prev, [refType.slug]: null }))}
                                />
                              </BlockStack>
                            ))}
                          </div>
                        </BlockStack>
                      </Box>
                    )}
                  </Box>

                  {/* Step 5 – Input Prompt */}
                  {!drawerOpen && (
                    <TextField
                      label="Describe the scene"
                      value={scenePrompt}
                      onChange={setScenePrompt}
                      placeholder="e.g. Luxury marble surface, warm studio lighting, minimalist background"
                      multiline={3}
                      autoComplete="off"
                      characterCount={scenePrompt.length}
                      maxLength={600}
                      helpText="Be specific, the AI reads every detail."
                    />
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
                          ✨ Generate Scene
                        </MagicButton>
                        <BlockStack gap="100">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Total credits: <strong className="tabular-nums">{credits.toLocaleString()}</strong>
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            This action uses:{' '}
                            <strong
                              className="tabular-nums"
                              style={{ color: (hasRefs || resolution !== '1K') ? ORANGE : 'inherit' }}
                            >
                              {creditsNeeded} credit{creditsNeeded !== 1 ? 's' : ''}
                            </strong>
                            {(hasRefs || resolution !== '1K') && (
                              <Text as="span" variant="bodySm" tone="subdued">
                                {' '}(base 2
                                {resolution !== '1K' ? ` + ${resolutionExtraCredits(resolution, RESOLUTION_OPTIONS)} ${resolution} res` : ''}
                                {hasRefs ? ' + 2 refs' : ''})
                              </Text>
                            )}
                          </Text>
                          {hasSearchGrounding && (
                            <Text variant="bodySm" tone="subdued" as="p">
                              Search grounding enabled: Replicate runtime cost multiplier may apply.
                            </Text>
                          )}
                          <Text variant="bodySm" tone="subdued" as="p">
                            Remaining after: <strong className="tabular-nums">{remainingAfter.toLocaleString()}</strong>
                          </Text>
                        </BlockStack>
                      </BlockStack>
                    )}
                  </Box>
                </BlockStack>
              </Card>
              </div>
            </Layout.Section>
          </Layout>

          <GenerationsGallery
            generations={recentGenerations}
            toolFilterOptions={GALLERY_TOOL_OPTIONS}
            shopifyAppBridge={shopifyAppBridge}
            showToast={showToast}
            exportFileName="product-ai-lab-export.zip"
            onGenerationsChange={setRecentGenerations}
          />
        </BlockStack>
      </Page>

      <BrowseFromStore
        open={browseModalOpen}
        onClose={() => setBrowseModalOpen(false)}
        onSelectImage={handleBrowseSelectImage}
      />
    </ShopifyLayout>
  );
}
