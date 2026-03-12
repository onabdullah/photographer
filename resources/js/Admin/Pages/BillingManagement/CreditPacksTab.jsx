import { useState, useCallback } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    Package, Plus, Pencil, Trash2, X, Star, Eye, EyeOff,
    DollarSign, Sparkles, TrendingUp,
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
            <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_popular}
                        onChange={(e) => setData('is_popular', e.target.checked)}
                        className="form-checkbox"
                    />
                    <span className="text-sm text-gray-700">Mark as Popular (Best Value)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="form-checkbox"
                    />
                    <span className="text-sm text-gray-700">Active (Visible to merchants)</span>
                </label>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={processing}
                    className="btn-secondary"
                >
                    Cancel
                </button>
                <button type="submit" disabled={processing} className="btn-primary">
                    {processing ? 'Saving...' : (isEdit ? 'Update Pack' : 'Create Pack')}
                </button>
            </div>
        </form>
    );
}

/* ─── PackCard ─────────────────────────────────────────────────── */

function PackCard({ pack, onEdit, onDelete }) {
    const perCreditCents = pack.credits > 0
        ? ((pack.price / pack.credits) * 100).toFixed(1) + '¢'
        : '—';

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-gray-900">
                        {fmt(pack.credits)} Credits
                    </h3>
                </div>
                <div className="flex items-center space-x-1">
                    {pack.is_popular && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                        </span>
                    )}
                    {pack.is_active ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Eye className="w-3 h-3 mr-1" />
                            Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Price:</span>
                    <span className="text-lg font-bold text-gray-900">{fmtPrice(pack.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Per Credit:</span>
                    <span className="text-sm font-medium text-gray-700">{perCreditCents}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sort Order:</span>
                    <span className="text-sm text-gray-700">{pack.sort_order}</span>
                </div>
            </div>

            <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                <button
                    onClick={onEdit}
                    className="flex-1 btn-secondary text-sm py-2"
                >
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                </button>
                <button
                    onClick={onDelete}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

/* ─── CreditPacksIndex ─────────────────────────────────────────────── */

export default function CreditPacksTab({ creditPacks, stats }) {
    const { delete: destroy } = useForm();

    const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', pack? }

    const openCreate = () => setModal({ mode: 'create' });
    const openEdit = (pack) => setModal({ mode: 'edit', pack });
    const closeModal = () => setModal(null);

    const handleDelete = useCallback((pack) => {
        if (!confirm(`Delete "${pack.credits} credits" pack?`)) return;
        destroy(`/admin/credit-packs/${pack.id}`, {
            preserveScroll: true,
            preserveState: false,
        });
    }, [destroy]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Credit Packs</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">One-time credit top-up packs for merchants</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Pack
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Packs</p>
                            <p className="text-xl font-bold text-gray-900">{stats.total_packs}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Eye className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Packs</p>
                            <p className="text-xl font-bold text-gray-900">{stats.active_packs}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Popular Pack</p>
                            <p className="text-xl font-bold text-gray-900">
                                {creditPacks.find(p => p.is_popular)?.credits ?? '—'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPacks.map((pack) => (
                    <PackCard
                        key={pack.id}
                        pack={pack}
                        onEdit={() => openEdit(pack)}
                        onDelete={() => handleDelete(pack)}
                    />
                ))}
            </div>

            {creditPacks.length === 0 && (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No credit packs yet</p>
                    <button onClick={openCreate} className="btn-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Pack
                    </button>
                </div>
            )}

            {/* Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div 
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {modal.mode === 'create' ? 'Create Credit Pack' : 'Edit Credit Pack'}
                            </h2>
                            <button 
                                onClick={closeModal} 
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(90vh-80px)] px-6 py-5">
                            <PackForm
                                pack={modal.pack}
                                onClose={closeModal}
                                mode={modal.mode}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
