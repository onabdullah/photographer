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

const ASPECT_RATIO_OPTIONS = [
  { value: '1:1',  label: '1:1' },
  { value: '4:3',  label: '4:3' },
  { value: '3:4',  label: '3:4' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
];

const RESOLUTION_OPTIONS = [
  { value: '1K', label: '1K', hint: 'Standard',   extraCredits: 0 },
  { value: '2K', label: '2K', hint: 'HD',         extraCredits: 1 },
  { value: '4K', label: '4K', hint: 'Ultra HD',   extraCredits: 3 },
];

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
function resolutionExtraCredits(resolution) {
  const opt = RESOLUTION_OPTIONS.find((o) => o.value === resolution);
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
export default function ProductAILab({ credits: initialCredits = 0 }) {
  /* ── State ── */
  const [credits, setCredits]                     = useState(() => Math.max(0, parseInt(initialCredits, 10) || 0));
  const [productImage, setProductImage]           = useState(null);
  const [aspectRatio, setAspectRatio]             = useState('1:1');
  const [resolution, setResolution]               = useState('1K');
  const [scenePrompt, setScenePrompt]             = useState('');
  const [processingStatus, setProcessingStatus]   = useState('idle');
  const [processingMsgIdx, setProcessingMsgIdx]   = useState(0);
  const [compareSliderPosition, setCompareSliderPosition] = useState(50);
  const [resultImageUrl, setResultImageUrl]       = useState(null);
  const [jobId, setJobId]                         = useState(null);
  const [generationId, setGenerationId]           = useState(null);
  const [toast, setToast]                         = useState(null);
  const [recentGenerations, setRecentGenerations] = useState([]);

  const [browseModalOpen, setBrowseModalOpen]     = useState(false);
  /* Pro Reference Drawer */
  const [drawerOpen, setDrawerOpen]     = useState(false);
  const [styleRef, setStyleRef]         = useState(null);
  const [faceRef, setFaceRef]           = useState(null);

  const [poseRef, setPoseRef]           = useState(null);
  const pollRef   = useRef(null);
  const pollCount = useRef(0);

  const shopifyAppBridge = (typeof window !== 'undefined' && window.shopify) || null;
  /* ── Derived ── */
  const isScanning     = processingStatus === 'uploading' || processingStatus === 'scanning';
  const isDone         = processingStatus === 'done';
  const hasProduct     = Boolean(productImage);
  const hasPrompt      = scenePrompt.trim().length > 0;
  const hasRefs        = Boolean(styleRef || faceRef || poseRef);
  const creditsNeeded  = 2 + resolutionExtraCredits(resolution) + (hasRefs ? 2 : 0);
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
    const poll = async () => {
      if (pollCount.current > 90) {
        setProcessingStatus('error');
        showToast('Generation timed out. Please try again.', true);
        return;
      }
      pollCount.current += 1;
      try {
        const res = await axios.get(`/shopify/api/ai-studio/job/${jobId}`);
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

  /* ── Dropzone handler ── */
  const handleProductDrop = useCallback((_all, accepted) => {
    const file = accepted[0];
    if (file) setProductImage(URL.createObjectURL(file));
  }, []);

  const handleBrowseSelectImage = useCallback((url) => {
    setProductImage(url);
    setBrowseModalOpen(false);
    showToast('Image selected');
  }, [showToast]);

  const makeRefDropHandler = (setter) => (_all, accepted) => {
    const file = accepted[0];
    if (file) setter(URL.createObjectURL(file));
  };

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    setProductImage(null);
    setScenePrompt('');
    setResultImageUrl(null);
    setCompareSliderPosition(50);
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
    if (!hasProduct) { showToast('Please upload a product image first.'); return; }
    if (!hasPrompt)  { showToast('Please describe the scene you want to create.'); return; }
    if (credits < creditsNeeded) {
      showToast(`Not enough credits. This action costs ${creditsNeeded} credits.`, true);
      return;
    }
    try {
      setProcessingStatus('uploading');
      setCompareSliderPosition(50);
      const form = new FormData();
      form.append('product_category', 'universal');
      form.append('prompt', scenePrompt);
      form.append('aspect_ratio', aspectRatio);
      form.append('resolution', resolution);

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

                  ) : isDone && resultImageUrl && productImage ? (
                    /* Result (AI Studio style compare) */
                    <div className="aistudio-hero-result-container">
                      <div className="aistudio-compare-slider-wrap">
                        <div className="aistudio-compare-labels">
                          <span className="aistudio-compare-label aistudio-compare-label-before">Before</span>
                          <span className="aistudio-compare-label aistudio-compare-label-after">After</span>
                        </div>
                        <div className="aistudio-compare-slider">
                          <div className="aistudio-compare-before" style={{ clipPath: `inset(0 ${100 - compareSliderPosition}% 0 0)` }}>
                            <img src={productImage} alt="Before" />
                          </div>
                          <div className="aistudio-compare-after" style={{ clipPath: `inset(0 0 0 ${compareSliderPosition}%)` }}>
                            <img
                              src={resultImageUrl}
                              alt="After"
                              onError={(e) => {
                                const img = e.target;
                                const src = img?.src || resultImageUrl;
                                let path = src;
                                try {
                                  if (typeof src === 'string' && src.startsWith('http')) path = new URL(src).pathname;
                                } catch (_) { /* ignore */ }
                                if (path && typeof path === 'string' && path.startsWith('/storage/') && typeof window !== 'undefined') {
                                  const sameOriginUrl = window.location.origin + path;
                                  if (sameOriginUrl !== src) {
                                    img.src = sameOriginUrl;
                                    return;
                                  }
                                }
                                showToast('Result image could not be loaded. The link may have expired.', true);
                                setResultImageUrl(null);
                              }}
                            />
                          </div>
                          <div
                            className="aistudio-compare-divider"
                            style={{ left: `${compareSliderPosition}%` }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const wrap = e.target?.closest('.aistudio-compare-slider-wrap');
                              if (!wrap) return;
                              const move = (e2) => {
                                const rect = wrap.getBoundingClientRect();
                                const x = ((e2.clientX - rect.left) / rect.width) * 100;
                                setCompareSliderPosition(Math.min(100, Math.max(0, x)));
                              };
                              const up = () => {
                                document.removeEventListener('mousemove', move);
                                document.removeEventListener('mouseup', up);
                              };
                              document.addEventListener('mousemove', move);
                              document.addEventListener('mouseup', up);
                            }}
                            role="slider"
                            aria-valuenow={compareSliderPosition}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Before / After comparison - drag to compare"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              const step = e.key === 'ArrowLeft' ? -2 : e.key === 'ArrowRight' ? 2 : 0;
                              if (step) {
                                e.preventDefault();
                                setCompareSliderPosition((p) => Math.min(100, Math.max(0, p + step)));
                              }
                            }}
                          >
                            <span className="aistudio-compare-handle">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M14 8L10 12L14 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M10 8L14 12L10 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </span>
                          </div>
                        </div>
                        <p className="aistudio-compare-hint">Drag the center handle left or right to compare before and after</p>
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
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
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
                          {[styleRef, faceRef, poseRef].filter(Boolean).length} active
                        </span>
                      )}
                    </button>

                    {drawerOpen && (
                      <Box paddingBlockStart="300">
                        <BlockStack gap="300">
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
                        </BlockStack>
                      </Box>
                    )}
                  </Box>

                  {/* Step 5 – Input Prompt */}
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
                                {resolution !== '1K' ? ` + ${resolutionExtraCredits(resolution)} ${resolution} res` : ''}
                                {hasRefs ? ' + 2 refs' : ''})
                              </Text>
                            )}
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
