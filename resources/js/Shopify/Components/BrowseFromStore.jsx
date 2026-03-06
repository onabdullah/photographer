import {
  Modal,
  TextField,
  BlockStack,
  InlineStack,
  Button,
  Text,
  Box,
  Popover,
  SkeletonBodyText,
  SkeletonThumbnail,
  Icon,
} from '@shopify/polaris';
import { ImageIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '@shopify/polaris-icons';
import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
];

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56"%3E%3Crect width="56" height="56" fill="%23f3f4f6"/%3E%3Cpath d="M28 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0 4c-8 0-14 5.4-14 12v2h28v-2c0-6.6-6-12-14-12z" fill="%239ca3af"/%3E%3C/svg%3E';

/**
 * Browse from Store – Professional product & image picker
 */
export default function BrowseFromStore({ open, onClose, onSelectImage }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [view, setView] = useState('products'); // products | images
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const gridRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.classList.add('ai-browse-modal-open');
    }
    return () => document.body.classList.remove('ai-browse-modal-open');
  }, [open]);

  const fetchProducts = useCallback(async (cursor = null, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const params = { limit: 24, status };
      if (cursor) params.cursor = cursor;
      if (search?.trim()) params.query = search.trim();
      const qs = new URLSearchParams(params).toString();
      const { data } = await axios.get(`/shopify/api/products?${qs}`);
      const newProducts = data.products || [];
      setProducts(append ? (prev) => [...prev, ...newProducts] : newProducts);
      setNextCursor(data.next_page_info || null);
      setHasMore(data.has_next || false);
    } catch (err) {
      setProducts((prev) => (append ? prev : []));
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [status, search]);

  useEffect(() => {
    if (open) {
      setView('products');
      setSelectedProduct(null);
      setProductImages([]);
      fetchProducts(null, false);
    }
  }, [open, status]);

  const searchDebounceRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => fetchProducts(null, false), 250);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search, open, fetchProducts]);

  const handleLoadMore = useCallback(() => {
    if (nextCursor && !loadingMore && hasMore) {
      fetchProducts(nextCursor, true);
    }
  }, [nextCursor, loadingMore, hasMore, fetchProducts]);

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    setProductImages(product.images?.length ? product.images : (product.image ? [product.image] : []));
    setView('images');
  }, []);

  const handleBack = useCallback(() => {
    setView('products');
    setSelectedProduct(null);
    setProductImages([]);
  }, []);

  const handleImageSelect = useCallback((url) => {
    onSelectImage?.(url);
    onClose?.();
  }, [onSelectImage, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (view === 'images') {
        handleBack();
      } else {
        onClose?.();
      }
    }
  }, [view, handleBack, onClose]);

  useEffect(() => {
    if (!open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore();
      },
      { root: gridRef.current, rootMargin: '100px', threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, [open, hasMore, loadingMore, handleLoadMore]);

  const renderProductList = () => (
    <div
      ref={gridRef}
      role="list"
      aria-label="Products"
      style={{
        border: '1px solid var(--p-color-border-subdued)',
        borderRadius: 12,
        overflow: 'hidden',
        maxHeight: 'calc(70vh - 140px)',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: i < 7 ? '1px solid var(--p-color-border-subdued)' : 'none',
            }}
          >
            <SkeletonThumbnail size="small" />
            <SkeletonBodyText lines={1} />
          </div>
        ))
      ) : products.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ opacity: 0.5 }}>
            <Icon source={ImageIcon} tone="subdued" />
          </div>
          <Text as="p" variant="bodyMd" tone="subdued" fontWeight="medium">
            No products found
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Try adjusting your search or filter
          </Text>
        </div>
      ) : (
        products.map((product) => (
          <button
            key={product.id}
            type="button"
            className="browse-product-row"
            onClick={() => handleProductClick(product)}
            aria-label={`View images for ${product.title}`}
          >
            <div className="browse-product-thumb">
              <img
                src={product.image || PLACEHOLDER_IMG}
                alt={product.title ? `Product: ${product.title}` : ''}
                loading="lazy"
                onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
              />
            </div>
            <div className="browse-product-meta">
              <div className="browse-product-title">{product.title || 'Untitled'}</div>
              <div className="browse-product-sub">
                {product.image_count > 0
                  ? `${product.image_count} image${product.image_count !== 1 ? 's' : ''}`
                  : 'No images'}
              </div>
            </div>
            <span className="browse-view-hint" aria-hidden="true">View images</span>
            <Icon source={ChevronRightIcon} tone="subdued" />
          </button>
        ))
      )}
      {hasMore && !loading && <div ref={loadMoreRef} style={{ height: 1 }} />}
      {loadingMore && (
        <div style={{ padding: 12, textAlign: 'center' }}>
          <SkeletonBodyText lines={1} />
        </div>
      )}
    </div>
  );

  const renderImageList = () => (
    <div
      role="list"
      aria-label="Product images"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: 12,
        overflowY: 'auto',
        maxHeight: 'calc(70vh - 140px)',
        padding: 2,
      }}
    >
      {productImages.length === 0 ? (
        <div
          style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: 40,
            color: 'var(--p-color-text-subdued)',
          }}
        >
          <Text as="p" variant="bodyMd">No images for this product</Text>
        </div>
      ) : (
        productImages.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            className="browse-image-tile"
            onClick={() => handleImageSelect(url)}
            aria-label={`Select image ${i + 1}`}
          >
            <img
              src={url}
              alt={`Product image ${i + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => { e.target.src = PLACEHOLDER_IMG; e.target.alt = 'Image unavailable'; }}
            />
          </button>
        ))
      )}
    </div>
  );

  const activeFilterLabel = STATUS_OPTIONS.find((o) => o.value === status)?.label || 'Status';
  const filterActivator = (
    <InlineStack gap="200" blockAlign="center">
      {status !== 'active' && (
        <span className="browse-filter-chip">
          {activeFilterLabel}
        </span>
      )}
      <Button variant="tertiary" size="slim" onClick={() => setFilterPopoverOpen(true)}>
        Add filter +
      </Button>
    </InlineStack>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={view === 'products' ? 'Add product' : selectedProduct?.title || 'Select image'}
      limitHeight
      primaryAction={
        view === 'images'
          ? null
          : { content: 'Cancel', onAction: onClose }
      }
      secondaryActions={
        view === 'images'
          ? [{ content: 'Back', onAction: handleBack }]
          : []
      }
      onKeyDown={handleKeyDown}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {view === 'products' && (
            <>
              <BlockStack gap="300">
                <InlineStack gap="300" blockAlign="end" wrap>
                  <div
                    style={{
                      flex: 1,
                      minWidth: 200,
                      borderRadius: 10,
                      overflow: 'hidden',
                      background: 'var(--p-color-bg-surface-secondary)',
                    }}
                  >
                    <TextField
                      label="Search products"
                      labelHidden
                      value={search}
                      onChange={setSearch}
                      placeholder="Search products by title..."
                      prefix={<Icon source={SearchIcon} />}
                      autoComplete="off"
                    />
                  </div>
                  <Popover
                    active={filterPopoverOpen}
                    onClose={() => setFilterPopoverOpen(false)}
                    activator={filterActivator}
                  >
                    <Popover.Pane>
                      <Box padding="300">
                        <BlockStack gap="100">
                          <Text as="h3" variant="headingSm" fontWeight="semibold">Status</Text>
                          {STATUS_OPTIONS.map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => {
                                setStatus(o.value);
                                setFilterPopoverOpen(false);
                              }}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 14px',
                                textAlign: 'left',
                                background: status === o.value ? 'var(--premium-teal-muted)' : 'transparent',
                                border: 'none',
                                borderRadius: 8,
                                cursor: 'pointer',
                                font: 'inherit',
                                fontWeight: status === o.value ? 500 : 400,
                                color: status === o.value ? 'var(--premium-teal)' : 'var(--p-color-text)',
                                transition: 'all 150ms ease',
                              }}
                            >
                              {o.label}
                            </button>
                          ))}
                        </BlockStack>
                      </Box>
                    </Popover.Pane>
                  </Popover>
                </InlineStack>
              </BlockStack>
              {renderProductList()}
            </>
          )}
          {view === 'images' && (
            <>
              <InlineStack gap="300" blockAlign="center">
                <Button
                  variant="plain"
                  icon={ChevronLeftIcon}
                  onClick={handleBack}
                  accessibilityLabel="Back to products"
                >
                  Back
                </Button>
                <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">
                  {productImages.length} image{productImages.length !== 1 ? 's' : ''} — click to select
                </Text>
              </InlineStack>
              {renderImageList()}
            </>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
