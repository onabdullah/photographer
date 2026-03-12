import { useState, useCallback } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Package, Plus, Pencil, Trash2, X, Star, Eye, EyeOff,
    DollarSign, TriangleAlert,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────── */

const fmt = (n) => Number(n ?? 0).toLocaleString();
const fmtPrice = (n) => '$' + Number(n ?? 0).toFixed(2);

const EMPTY_PACK = {
    credits: '', price: '', per_credit_cost: '',
    is_popular: false, is_active: true, sort_order: '',
};

/* ─── PackForm (shared create / edit) ─────────────────────────────── */

function PackForm({ pack, onClose, mode }) {
    const isEdit = mode === 'edit';
    const { data, setData, post, put, processing, errors, reset } = useForm(
        pack ?? { ...EMPTY_PACK },
    );

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            preserveState: false,
            onSuccess: () => { reset(); onClose(); },
        };
        if (isEdit) {
            put(`/admin/credit-packs/${pack.id}`, opts);
        } else {
            post('/admin/credit-packs', opts);
        }
    };

    // Auto-calculate per_credit_cost
    const calculatePerCredit = () => {
        if (data.credits && data.price) {
            const cost = (parseFloat(data.price) / parseInt(data.credits)).toFixed(4);
            setData('per_credit_cost', cost);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Credits */}
            <div>
                <label className="form-label">Credits <span className="text-red-500">*</span></label>
                <input
                    type="number"
                    min="1"
                    value={data.credits}
                    onChange={(e) => setData('credits', e.target.value)}
                    onBlur={calculatePerCredit}
                    className="form-input"
                    placeholder="e.g. 100"
                />
                {errors.credits && <p className="form-error">{errors.credits}</p>}
            </div>

            {/* Price + Per Credit Cost */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Price (USD) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
                        <input
                            type="number"
                            min="0" step="0.01"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            onBlur={calculatePerCredit}
                            className="form-input pl-7"
                            placeholder="0.00"
                        />
                    </div>
                    {errors.price && <p className="form-error">{errors.price}</p>}
                </div>
                <div>
                    <label className="form-label">Per Credit Cost</label>
                    <input
                        type="number"
                        min="0" step="0.0001"
                        value={data.per_credit_cost}
                        onChange={(e) => setData('per_credit_cost', e.target.value)}
                        className="form-input"
                        placeholder="Auto-calculated"
                    />
                    {errors.per_credit_cost && <p className="form-error">{errors.per_credit_cost}</p>}
                </div>
            </div>

            {/* Sort Order */}
            <div>
                <label className="form-label">Sort Order</label>
                <input
                    type="number"
                    min="0"
                    value={data.sort_order}
                    onChange={(e) => setData('sort_order', e.target.value)}
                    className="form-input"
                    placeholder="0"
                />
                {errors.sort_order && <p className="form-error">{errors.sort_order}</p>}
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={data.is_popular}
                        onChange={(e) => setData('is_popular', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark as Popular</span>
                        <p className="text-xs text-gray-400">Highlighted as best value</p>
                    </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                        <p className="text-xs text-gray-400">Visible to merchants</p>
                    </div>
                </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" disabled={processing} className="btn btn-primary">
                    {processing ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Pack')}
                </button>
                <button type="button" onClick={onClose} className="btn btn-secondary">
                    Cancel
                </button>
            </div>
        </form>
    );
}

/* ─── Modal ───────────────────────────────────────────────────────── */

function Modal({ open, onClose, title, children }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ─── PackCard ─────────────────────────────────────────────────── */

function PackCard({ pack, onEdit, isConfirming, onDeleteToggle }) {
    const perCreditFormatted = pack.credits > 0
        ? ((pack.price / pack.credits) * 100).toFixed(2) + '¢'
        : '—';

    return (
        <div className="card relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <Package size={18} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                            {fmt(pack.credits)} Credits
                        </p>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            {pack.is_popular && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                    <Star size={9} />
                                    Popular
                                </span>
                            )}
                            {pack.is_active ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                    <Eye size={9} />
                                    Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                    <EyeOff size={9} />
                                    Hidden
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                        onClick={() => onEdit(pack)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Edit"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={() => onDeleteToggle(pack.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Price */}
            <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {fmtPrice(pack.price)}
                </span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Per Credit</p>
                    <div className="flex items-center gap-1">
                        <DollarSign size={11} className="text-orange-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{perCreditFormatted}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Sort Order</p>
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{pack.sort_order ?? '—'}</span>
                </div>
            </div>

            {/* Delete confirm overlay */}
            {isConfirming && (
                <DeleteOverlay pack={pack} onDeleteToggle={onDeleteToggle} />
            )}
        </div>
    );
}

function DeleteOverlay({ pack, onDeleteToggle }) {
    const { delete: destroy, processing } = useForm();
    return (
        <div className="absolute inset-0 z-10 rounded-lg bg-white/[.97] dark:bg-gray-900/[.97] flex flex-col items-center justify-center gap-3 p-6">
            <TriangleAlert size={22} className="text-red-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                Delete <span className="text-red-600">{fmt(pack.credits)} Credits</span> pack?
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => destroy(`/admin/credit-packs/${pack.id}`, {
                        preserveScroll: true,
                        preserveState: false,
                        onSuccess: () => onDeleteToggle(null),
                    })}
                    disabled={processing}
                    className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                    {processing ? 'Deleting…' : 'Confirm'}
                </button>
                <button
                    onClick={() => onDeleteToggle(null)}
                    className="px-4 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

/* ─── CreditPacksTab ───────────────────────────────────────────────── */

export default function CreditPacksTab({ creditPacks, stats }) {
    const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', pack? }
    const [confirmDelete, setConfirmDelete] = useState(null); // pack id

    const openCreate = () => setModal({ mode: 'create' });
    const openEdit = (pack) => setModal({ mode: 'edit', pack });
    const closeModal = () => setModal(null);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Credit Packs</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">One-time credit top-up packs for merchants</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">
                    <Plus size={14} className="mr-1.5" />
                    Add Pack
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Packs',  value: stats.total_packs,  icon: Package, color: 'text-primary-500'   },
                    { label: 'Active Packs', value: stats.active_packs, icon: Eye,     color: 'text-green-500'     },
                    { label: 'Popular Pack', value: creditPacks.find(p => p.is_popular)?.credits ?? '—', icon: Star, color: 'text-amber-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                            <Icon size={18} className={color} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{fmt(value)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Packs Grid */}
            {creditPacks.length === 0 ? (
                <div className="card flex flex-col items-center justify-center py-16 gap-3">
                    <Package size={36} className="text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No credit packs yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click "Add Pack" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {creditPacks.map((pack) => (
                        <PackCard
                            key={pack.id}
                            pack={pack}
                            onEdit={openEdit}
                            isConfirming={confirmDelete === pack.id}
                            onDeleteToggle={(id) => setConfirmDelete(id === confirmDelete ? null : id)}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Modal
                open={modal !== null}
                onClose={closeModal}
                title={modal?.mode === 'edit' ? `Edit Pack — ${fmt(modal.pack?.credits)} Credits` : 'Create Credit Pack'}
            >
                {modal && (
                    <PackForm
                        key={modal.pack?.id ?? 'create'}
                        pack={modal.mode === 'edit' ? modal.pack : null}
                        onClose={closeModal}
                        mode={modal.mode}
                    />
                )}
            </Modal>
        </div>
    );
}
