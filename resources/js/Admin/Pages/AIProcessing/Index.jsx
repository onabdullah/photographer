import { useState } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { Link, router } from '@inertiajs/react';
import { Zap, ImageIcon, Filter } from 'lucide-react';

const TOOL_LABELS = {
    universal_generate: 'Product AI Lab (VTO)',
    magic_eraser: 'Magic Eraser',
    background_remover: 'Background Remover',
    compressor: 'Image Compressor',
    upscaler: 'Upscaler',
    enhance: 'Image Enhancer',
    lighting: 'Lighting Fix',
};

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toolLabel(key) {
    return TOOL_LABELS[key] || key;
}

function buildQuery(params) {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '' && v !== 'all') q.set(k, v);
    });
    const s = q.toString();
    return s ? `?${s}` : '';
}

export default function AIProcessingIndex({
    categories = [],
    stores = [],
    fileTypeOptions = [],
    masterpieces,
    filters = {},
}) {
    const { tool: toolFilter = 'all', store: storeFilter = '', type: typeFilter = 'all', date_from: dateFrom = '', date_to: dateTo = '', usage: usageFilter = 'all' } = filters;
    const paginator = masterpieces;
    const items = paginator?.data ?? [];
    const [loadedIds, setLoadedIds] = useState(() => new Set());

    const baseParams = {
        tool: toolFilter,
        store: storeFilter,
        type: typeFilter,
        date_from: dateFrom,
        date_to: dateTo,
        usage: usageFilter,
    };

    const toolHref = (toolKey) =>
        `/admin/ai-processing${buildQuery({ ...baseParams, tool: toolKey === 'all' ? undefined : toolKey })}`;

    const filterHref = (key, value) =>
        `/admin/ai-processing${buildQuery({ ...baseParams, [key]: value || undefined })}`;

    return (
        <AdminLayout
            title="AI Processing"
            breadcrumbs={[{ label: 'AI Processing' }]}
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Zap size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Masterpieces gallery — by category
                    </span>
                </div>

                {/* Category tabs (tool) */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <Link
                            key={cat.key}
                            href={toolHref(cat.key)}
                            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                toolFilter === cat.key
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {cat.label}
                        </Link>
                    ))}
                </div>

                {/* Filters: Store, Type, Date, Usage */}
                <div className="card p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <Filter size={14} />
                            Filters
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Store</label>
                            <select
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-1.5 px-2.5 min-w-[140px]"
                                value={storeFilter}
                                onChange={(e) => router.get(filterHref('store', e.target.value))}
                            >
                                <option value="">All stores</option>
                                {stores.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Type</label>
                            <select
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-1.5 px-2.5 min-w-[100px]"
                                value={typeFilter}
                                onChange={(e) => router.get(filterHref('type', e.target.value))}
                            >
                                {fileTypeOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
                            <input
                                type="date"
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-1.5 px-2.5"
                                value={dateFrom}
                                onChange={(e) => router.get(filterHref('date_from', e.target.value))}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
                            <input
                                type="date"
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-1.5 px-2.5"
                                value={dateTo}
                                onChange={(e) => router.get(filterHref('date_to', e.target.value))}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Usage</label>
                            <select
                                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-1.5 px-2.5 min-w-[120px]"
                                value={usageFilter}
                                onChange={(e) => router.get(filterHref('usage', e.target.value))}
                            >
                                <option value="all">All</option>
                                <option value="downloaded">Downloaded</option>
                                <option value="on_product">On product</option>
                            </select>
                        </div>
                        {(storeFilter || typeFilter !== 'all' || dateFrom || dateTo || usageFilter !== 'all') && (
                            <Link
                                href="/admin/ai-processing"
                                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                            >
                                Clear filters
                            </Link>
                        )}
                    </div>
                </div>

                {/* Gallery grid */}
                <div className="card overflow-hidden">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <ImageIcon size={40} className="mb-3 text-gray-300 dark:text-gray-600" />
                            <p className="text-sm font-medium text-gray-900 dark:text-white">No masterpieces yet</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {toolFilter === 'all'
                                    ? 'AI Studio creations will appear here.'
                                    : `No creations for ${categories.find((c) => c.key === toolFilter)?.label ?? toolFilter}.`}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                className="grid gap-3 p-4"
                                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
                            >
                                {items.map((gen) => (
                                    <div
                                        key={gen.id}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                    >
                                        <div className={`aiprocessing-card-image-wrap aspect-square relative bg-gray-100 dark:bg-gray-700 ${loadedIds.has(gen.id) ? 'is-loaded' : ''}`}>
                                            {gen.result_image_url ? (
                                                <>
                                                    <div className="aiprocessing-card-skeleton" aria-hidden="true" />
                                                    <img
                                                        src={gen.result_image_url}
                                                        alt="Generated image"
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                        onLoad={() => setLoadedIds((prev) => new Set(prev).add(gen.id))}
                                                    />
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400 flex items-center justify-center h-full">—</span>
                                            )}
                                        </div>
                                        <div className="p-2 space-y-0.5">
                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate" title={gen.shop_domain}>
                                                {gen.shop_domain || '—'}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                {toolLabel(gen.tool_used)}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                {formatDate(gen.updated_at || gen.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {paginator?.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Showing{' '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {(paginator.current_page - 1) * paginator.per_page + 1}
                                        </span>
                                        {' – '}
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {Math.min(paginator.current_page * paginator.per_page, paginator.total)}
                                        </span>
                                        {' of '}
                                        <span className="font-medium text-gray-900 dark:text-white">{paginator.total}</span>
                                    </p>
                                    <div className="flex gap-2">
                                        {paginator.prev_page_url ? (
                                            <Link
                                                href={paginator.prev_page_url}
                                                className="btn btn-secondary text-sm py-1.5 px-3"
                                            >
                                                Previous
                                            </Link>
                                        ) : (
                                            <span className="btn btn-secondary text-sm py-1.5 px-3 opacity-40 cursor-not-allowed">
                                                Previous
                                            </span>
                                        )}
                                        {paginator.next_page_url ? (
                                            <Link
                                                href={paginator.next_page_url}
                                                className="btn btn-secondary text-sm py-1.5 px-3"
                                            >
                                                Next
                                            </Link>
                                        ) : (
                                            <span className="btn btn-secondary text-sm py-1.5 px-3 opacity-40 cursor-not-allowed">
                                                Next
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
