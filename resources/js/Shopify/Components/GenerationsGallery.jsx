/**
 * GenerationsGallery – shared gallery used by AI Studio and Product AI Lab (VTO).
 *
 * Props:
 *   generations      {array}    All (unfiltered) generation objects from the server.
 *   toolFilterOptions {array}   [{value, label}] for the Tool <Select>.
 *   shopifyAppBridge  {object}  window.shopify – for resourcePicker (assign to product).
 *   showToast         {fn}      (message: string, isError?: bool) => void
 *   exportFileName    {string}  Filename for the downloaded ZIP (e.g. 'ai-studio-export.zip').
 *   onGenerationsChange {fn}    (updatedList: array) => void – called when a gen is deleted so
 *                               the parent can sync its own state.
 */
import {
  Card,
  Text,
  BlockStack,
  InlineStack,
  Select,
  Button,
  Box,
  Icon,
  Tooltip,
  ChoiceList,
} from '@shopify/polaris';
import {
  DeleteIcon,
  ExportIcon,
  ImageIcon,
  ImageMagicIcon,
} from '@shopify/polaris-icons';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* ─── constants ──────────────────────────────────────────────────── */
const GALLERY_DATE_OPTIONS = [
  { value: 'all',          label: 'All time' },
  { value: 'today',        label: 'Today' },
  { value: 'last_7_days',  label: 'Last 7 days' },
  { value: 'last_30_days', label: 'Last 30 days' },
];

/* ─── helpers ────────────────────────────────────────────────────── */
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

function resolveImagePath(src) {
  try {
    if (typeof src === 'string' && src.startsWith('http')) {
      const path = new URL(src).pathname;
      if (path.startsWith('/storage/') && typeof window !== 'undefined') {
        return window.location.origin + path;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/* ─── component ──────────────────────────────────────────────────── */
export default function GenerationsGallery({
  generations,
  toolFilterOptions,
  shopifyAppBridge,
  showToast,
  exportFileName = 'masterpieces-export.zip',
  onGenerationsChange,
}) {
  /* ── local state ── */
  const [galleryDateFilter, setGalleryDateFilter]   = useState('all');
  const [galleryToolFilter, setGalleryToolFilter]   = useState('all');
  const [gridColumns, setGridColumns]               = useState(4);
  const [loadedIds, setLoadedIds]                   = useState(() => new Set());
  const [deleteModalGen, setDeleteModalGen]         = useState(null);
  const [exportModalOpen, setExportModalOpen]       = useState(false);
  const [exportType, setExportType]                 = useState('flat');
  const [exportSpecificTool, setExportSpecificTool] = useState(
    () => (toolFilterOptions?.find((o) => o.value !== 'all')?.value ?? ''),
  );
  const [isExporting, setIsExporting]               = useState(false);

  /* ── App Bridge ui-modal refs ── */
  const deleteModalRef = useRef(null);
  const exportModalRef = useRef(null);
  const isExportingRef = useRef(false);
  useEffect(() => { isExportingRef.current = isExporting; }, [isExporting]);

  /* show / hide delete modal */
  useEffect(() => {
    const el = deleteModalRef.current;
    if (!el) return;
    if (deleteModalGen !== null) el.show?.(); else el.hide?.();
  }, [deleteModalGen]);

  /* handle delete modal closed via App Bridge X button */
  useEffect(() => {
    const el = deleteModalRef.current;
    if (!el) return;
    const onHide = () => setDeleteModalGen(null);
    el.addEventListener('hide', onHide);
    return () => el.removeEventListener('hide', onHide);
  }, []);

  /* show / hide export modal */
  useEffect(() => {
    const el = exportModalRef.current;
    if (!el) return;
    if (exportModalOpen) el.show?.(); else el.hide?.();
  }, [exportModalOpen]);

  /* handle export modal closed via App Bridge X button */
  useEffect(() => {
    const el = exportModalRef.current;
    if (!el) return;
    const onHide = () => { if (!isExportingRef.current) setExportModalOpen(false); };
    el.addEventListener('hide', onHide);
    return () => el.removeEventListener('hide', onHide);
  }, []);

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    let list = galleryToolFilter === 'all'
      ? generations
      : generations.filter((g) => (g.tool_used || '') === galleryToolFilter);

    if (galleryDateFilter !== 'all') {
      const now = new Date();
      list = list.filter((g) => {
        const gDate = new Date(g.updated_at || g.created_at);
        if (galleryDateFilter === 'today') {
          return gDate.toDateString() === now.toDateString();
        }
        const diffDays = (now - gDate) / (1000 * 60 * 60 * 24);
        if (galleryDateFilter === 'last_7_days')  return diffDays <= 7;
        if (galleryDateFilter === 'last_30_days') return diffDays <= 30;
        return true;
      });
    }
    return list;
  }, [generations, galleryToolFilter, galleryDateFilter]);

  /* ── download helper ── */
  const handleDownload = useCallback((gen) => {
    const a = document.createElement('a');
    a.href = gen.result_image_url;
    a.download = 'masterpiece.png';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download started');
    axios.post('/shopify/tools/generation/downloaded', { generation_id: gen.id }).catch(() => {});
  }, [showToast]);

  /* ── save to product ── */
  const handleSaveToProduct = useCallback(async (gen) => {
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
      const res = await axios.post('/shopify/assign-to-product', {
        product_id:    productId,
        generation_id: gen.id,
      });
      if (res.data.success) {
        showToast(res.data.message);
        onGenerationsChange?.(
          generations.map((g) =>
            g.id === gen.id ? { ...g, shopify_product_id: productId } : g,
          ),
        );
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to add to product.', true);
    }
  }, [shopifyAppBridge, showToast, generations, onGenerationsChange]);

  /* ── delete ── */
  const handleDeleteConfirm = useCallback(async () => {
    const gen = deleteModalGen;
    setDeleteModalGen(null);
    try {
      await axios.delete(`/shopify/tools/generation/${gen.id}`);
      onGenerationsChange?.(generations.filter((g) => g.id !== gen.id));
      showToast('Image deleted.');
    } catch {
      showToast('Could not delete image. Please try again.', true);
    }
  }, [deleteModalGen, generations, onGenerationsChange, showToast]);

  /* ── export zip ── */
  const handleExportZip = useCallback(async () => {
    let gensToExport = filtered;
    if (exportType === 'specific_tool') {
      gensToExport = generations.filter((g) => (g.tool_used || '') === exportSpecificTool);
    }
    if (!gensToExport.length) {
      showToast('No creations to export');
      setExportModalOpen(false);
      return;
    }
    setIsExporting(true);
    showToast(`Gathering ${gensToExport.length} images for export…`);
    try {
      const zip = new JSZip();
      await Promise.all(
        gensToExport.map(async (gen, i) => {
          try {
            const blob   = await fetch(gen.result_image_url).then((r) => r.blob());
            const folder = exportType === 'categories' ? `${gen.tool_used || 'uncategorized'}/` : '';
            zip.file(`${folder}masterpiece-${i + 1}.png`, blob);
          } catch { /* skip */ }
        }),
      );
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, exportFileName);
      showToast('Export successful!');
      setExportModalOpen(false);
    } catch {
      showToast('Failed to create export ZIP', true);
    } finally {
      setIsExporting(false);
    }
  }, [filtered, generations, exportType, exportSpecificTool, exportFileName, showToast]);

  /* ── render ── */
  const toolOptionsForExport = (toolFilterOptions ?? []).filter((o) => o.value !== 'all');

  return (
    <>
      <Box paddingBlockStart="600">
        <Card>
          <BlockStack gap="400">
            {/* Header bar */}
            <InlineStack align="space-between" blockAlign="center" wrap gap="400">
              <Text as="h2" variant="headingMd">Recent Masterpieces</Text>

              <InlineStack gap="300" blockAlign="center" wrap>
                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">Date:</Text>
                  <Select
                    label=""
                    labelHidden
                    options={GALLERY_DATE_OPTIONS}
                    value={galleryDateFilter}
                    onChange={setGalleryDateFilter}
                  />
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">Tool:</Text>
                  <Select
                    label=""
                    labelHidden
                    options={toolFilterOptions}
                    value={galleryToolFilter}
                    onChange={setGalleryToolFilter}
                  />
                </InlineStack>

                <InlineStack gap="200" blockAlign="center">
                  <Text as="span" variant="bodySm" tone="subdued">Grid:</Text>
                  <Select
                    label=""
                    labelHidden
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

            {/* Gallery grid */}
            {filtered.length === 0 ? (
              <div className="aistudio-gallery-empty">
                <div className="aistudio-gallery-empty-icon" aria-hidden>
                  <Icon source={ImageMagicIcon} tone="subdued" />
                </div>
                <Text as="h3" variant="headingMd">
                  {generations.length === 0
                    ? 'Your gallery will appear here'
                    : `No creations for ${toolFilterOptions?.find((o) => o.value === galleryToolFilter)?.label ?? 'this filter'}`}
                </Text>
              </div>
            ) : (
              <div
                className="aistudio-gallery aistudio-gallery--masonry"
                style={{ ['--gallery-columns']: gridColumns }}
              >
                {filtered.map((gen) => (
                  <div key={gen.id} className="aistudio-gallery-card">
                    <div className={`aistudio-gallery-card-image-wrap${loadedIds.has(gen.id) ? ' is-loaded' : ''}`}>
                      <div className="aistudio-gallery-card-checkerboard">
                        <div className="aistudio-gallery-card-skeleton" aria-hidden="true" />
                        <img
                          src={gen.result_image_url}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          onLoad={() => setLoadedIds((prev) => new Set(prev).add(gen.id))}
                          onError={(e) => {
                            const fallback = resolveImagePath(e.target?.src || gen.result_image_url);
                            if (fallback) e.target.src = fallback;
                          }}
                        />
                      </div>

                      {/* Hover overlay */}
                      <div className="aistudio-gallery-card-overlay">
                        <InlineStack gap="200" blockAlign="center">
                          <Tooltip content="Download">
                            <Button
                              size="slim"
                              icon={ExportIcon}
                              accessibilityLabel="Download"
                              onClick={() => handleDownload(gen)}
                            />
                          </Tooltip>
                          <Tooltip content="Save to Shopify Product Media">
                            <Button
                              size="slim"
                              icon={ImageIcon}
                              accessibilityLabel="Save to Shopify Product Media"
                              onClick={() => handleSaveToProduct(gen)}
                            />
                          </Tooltip>
                          <Tooltip content="Delete">
                            <Button
                              size="slim"
                              icon={DeleteIcon}
                              accessibilityLabel="Delete"
                              onClick={() => setDeleteModalGen(gen)}
                            />
                          </Tooltip>
                        </InlineStack>
                      </div>
                    </div>

                    <div className="aistudio-gallery-card-meta">
                      <Text as="span" variant="bodySm" tone="subdued">
                        {timeAgo(gen.updated_at || gen.created_at)}
                      </Text>
                      {gen.shopify_product_id && (
                        <Text as="span" variant="bodySm" tone="subdued">
                          {' · '}On product
                        </Text>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BlockStack>
        </Card>
      </Box>

      {/* Delete modal – ui-modal renders backdrop at Shopify admin level */}
      <ui-modal id="gallery-delete-modal" ref={deleteModalRef}>
        <div style={{ padding: '20px' }}>
          <Text as="p">
            This image will be permanently removed from your gallery. This action cannot be undone.
          </Text>
        </div>
        <ui-title-bar title="Delete image permanently?">
          <button variant="primary" tone="critical" onClick={handleDeleteConfirm}>Delete permanently</button>
          <button onClick={() => setDeleteModalGen(null)}>Cancel</button>
        </ui-title-bar>
      </ui-modal>

      {/* Export modal – ui-modal renders backdrop at Shopify admin level */}
      <ui-modal id="gallery-export-modal" ref={exportModalRef}>
        <div style={{ padding: '20px' }}>
          <BlockStack gap="400">
            <Text as="p" tone="subdued">
              All your creations are securely processed and ready for download. Select how you'd like
              to organise your exported files.
            </Text>

            <ChoiceList
              title="Export Organisation"
              choices={[
                { label: 'All in one folder (uses current filters)', value: 'flat' },
                {
                  label: 'Organised by tool (folders)',
                  value: 'categories',
                  helpText: 'Creates a separate folder for each AI tool inside the ZIP.',
                },
                ...(toolOptionsForExport.length > 1
                  ? [{
                      label: 'Specific tool only (ignores filters)',
                      value: 'specific_tool',
                      helpText: 'Download all creations for one AI tool.',
                    }]
                  : []),
              ]}
              selected={[exportType]}
              onChange={([v]) => setExportType(v)}
            />

            {exportType === 'specific_tool' && toolOptionsForExport.length > 1 && (
              <Box paddingBlockStart="200">
                <Select
                  label="Select tool to export"
                  options={toolOptionsForExport.map((o) => {
                    const count = generations.filter((g) => (g.tool_used || '') === o.value).length;
                    return { value: o.value, label: `${o.label} (${count})` };
                  })}
                  value={exportSpecificTool}
                  onChange={setExportSpecificTool}
                />
              </Box>
            )}

            <Text as="p" variant="bodySm" tone="subdued">
              {exportType === 'specific_tool'
                ? `${generations.filter((g) => (g.tool_used || '') === exportSpecificTool).length} image(s) will be included.`
                : `${filtered.length} image${filtered.length !== 1 ? 's' : ''} will be included based on your current filters.`}
            </Text>
          </BlockStack>
        </div>
        <ui-title-bar title="Export Your Masterpieces">
          <button
            variant="primary"
            onClick={handleExportZip}
            disabled={
              isExporting ||
              (exportType === 'specific_tool'
                ? generations.filter((g) => (g.tool_used || '') === exportSpecificTool).length === 0
                : filtered.length === 0) || undefined
            }
          >
            {isExporting ? 'Creating ZIP…' : 'Export'}
          </button>
          <button onClick={() => !isExporting && setExportModalOpen(false)} disabled={isExporting || undefined}>
            Cancel
          </button>
        </ui-title-bar>
      </ui-modal>
    </>
  );
}
