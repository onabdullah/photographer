import { useState, useCallback } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import {
    CreditCard, Plus, Pencil, Trash2, Users, X,
    Sparkles, DollarSign, ShieldCheck, TriangleAlert,
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────── */

const fmt = (n) => Number(n ?? 0).toLocaleString();
const fmtPrice = (n) => '$' + Number(n ?? 0).toFixed(2);

const TYPE_OPTS = [
    { value: 'RECURRING', label: 'Recurring (monthly)' },
    { value: 'ONCE', label: 'One-time charge' },
];

const EMPTY_PLAN = {
    name: '', type: 'RECURRING', price: '', trial_days: '0',
    monthly_credits: '', on_install: false, test: false,
    capped_amount: '', terms: '', features: [],
};

/* ─── PlanForm (shared create / edit) ─────────────────────────────── */

function PlanForm({ plan, onClose, mode }) {
    const isEdit = mode === 'edit';
    const { data, setData, post, put, processing, errors, reset } = useForm(
        plan ?? { ...EMPTY_PLAN },
    );

    const submit = (e) => {
        e.preventDefault();
        const opts = {
            preserveScroll: true,
            preserveState: false, // Force fresh data from server
            onSuccess: () => { reset(); onClose(); },
        };
        if (isEdit) {
            put(`/admin/plans/${plan.id}`, opts);
        } else {
            post('/admin/plans', opts);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
                <label className="form-label">Plan Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    className="form-input"
                    placeholder="e.g. Pro Plan"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            {/* Type + Price */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Type <span className="text-red-500">*</span></label>
                    <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="form-input">
                        {TYPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {errors.type && <p className="form-error">{errors.type}</p>}
                </div>
                <div>
                    <label className="form-label">Price (USD) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
                        <input
                            type="number"
                            min="0" step="0.01"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            className="form-input pl-7"
                            placeholder="0.00"
                        />
                    </div>
                    {errors.price && <p className="form-error">{errors.price}</p>}
                </div>
            </div>

            {/* Monthly credits + trial days */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Monthly Credits <span className="text-red-500">*</span></label>
                    <input
                        type="number"
                        min="0"
                        value={data.monthly_credits}
                        onChange={(e) => setData('monthly_credits', e.target.value)}
                        className="form-input"
                        placeholder="e.g. 500"
                    />
                    {errors.monthly_credits && <p className="form-error">{errors.monthly_credits}</p>}
                </div>
                <div>
                    <label className="form-label">Trial Days</label>
                    <input
                        type="number"
                        min="0" max="30"
                        value={data.trial_days}
                        onChange={(e) => setData('trial_days', e.target.value)}
                        className="form-input"
                        placeholder="0"
                    />
                    {errors.trial_days && <p className="form-error">{errors.trial_days}</p>}
                </div>
            </div>

            {/* Capped amount + terms (optional) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="form-label">Capped Amount <span className="text-gray-400 text-xs font-normal">(usage billing)</span></label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-sm pointer-events-none">$</span>
                        <input
                            type="number" min="0" step="0.01"
                            value={data.capped_amount}
                            onChange={(e) => setData('capped_amount', e.target.value)}
                            className="form-input pl-7"
                            placeholder="leave blank"
                        />
                    </div>
                    {errors.capped_amount && <p className="form-error">{errors.capped_amount}</p>}
                </div>
                <div>
                    <label className="form-label">Billing Terms</label>
                    <input
                        type="text"
                        value={data.terms}
                        onChange={(e) => setData('terms', e.target.value)}
                        className="form-input"
                        placeholder="Optional"
                        maxLength={255}
                    />
                    {errors.terms && <p className="form-error">{errors.terms}</p>}
                </div>
            </div>

            {/* Plan Features */}
            <div>
                <label className="form-label">Plan Features</label>
                <p className="text-xs text-gray-500 mb-2">Features shown to merchants on billing page</p>
                <div className="space-y-2">
                    {(data.features || []).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                value={feature}
                                onChange={(e) => {
                                    const newFeatures = [...(data.features || [])];
                                    newFeatures[index] = e.target.value;
                                    setData('features', newFeatures);
                                }}
                                className="form-input flex-1"
                                placeholder="e.g. 500 AI generations / month"
                                maxLength={255}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newFeatures = (data.features || []).filter((_, i) => i !== index);
                                    setData('features', newFeatures);
                                }}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setData('features', [...(data.features || []), ''])}
                        className="btn-secondary text-sm"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Feature
                    </button>
                </div>
                {errors.features && <p className="form-error">{errors.features}</p>}
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={data.on_install}
                        onChange={(e) => setData('on_install', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-assign on install</span>
                        <p className="text-xs text-gray-400">New merchants get this plan automatically</p>
                    </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={data.test}
                        onChange={(e) => setData('test', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Test mode</span>
                        <p className="text-xs text-gray-400">No real charges (Shopify dev stores)</p>
                    </div>
                </label>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button type="submit" disabled={processing} className="btn btn-primary">
                    {processing ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Plan')}
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
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
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

/* ─── Plan card ───────────────────────────────────────────────────── */

function PlanCard({ plan, onEdit, isConfirming, onDeleteToggle }) {
    const { delete: destroy, processing } = useForm();

    return (
        <div className="card relative overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                        <CreditCard size={18} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{plan.name}</p>
                        <div className="flex items-center flex-wrap gap-1.5 mt-1">
                            {plan.on_install && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                    <ShieldCheck size={9} /> Default
                                </span>
                            )}
                            {plan.test && (
                                <span className="inline-flex px-1.5 py-px rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                                    Test
                                </span>
                            )}
                            <span className={[
                                'inline-flex items-center px-1.5 py-px rounded text-[10px] font-medium',
                                plan.type === 'RECURRING'
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
                            ].join(' ')}>
                                {plan.type === 'RECURRING' ? 'Recurring' : 'One-time'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                        onClick={() => onEdit(plan)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        title="Edit"
                    >
                        <Pencil size={13} />
                    </button>
                    <button
                        onClick={() => onDeleteToggle(plan.id)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {/* Price */}
            <div className="mb-4">
                {plan.price === 0 ? (
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">Free</span>
                ) : (
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {fmtPrice(plan.price)}
                        {plan.type === 'RECURRING' && (
                            <span className="text-sm font-normal text-gray-400 ml-1">/mo</span>
                        )}
                    </span>
                )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Credits</p>
                    <div className="flex items-center gap-1">
                        <Sparkles size={11} className="text-orange-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt(plan.monthly_credits)}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Trial</p>
                    {plan.trial_days > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                            {plan.trial_days}d free
                        </span>
                    ) : (
                        <span className="text-sm text-gray-400">—</span>
                    )}
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Merchants</p>
                    <div className="flex items-center gap-1">
                        <Users size={11} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt(plan.merchants_count)}</span>
                    </div>
                </div>
            </div>

            {/* Delete confirm overlay */}
            {isConfirming && (
                <div className="absolute inset-0 z-10 rounded-lg bg-white/[.97] dark:bg-gray-900/[.97] flex flex-col items-center justify-center gap-3 p-6">
                    <TriangleAlert size={22} className="text-red-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                        Delete <span className="text-red-600">{plan.name}</span>?
                    </p>
                    {plan.merchants_count > 0 ? (
                        <>
                            <p className="text-xs text-red-600 dark:text-red-400 text-center">
                                {plan.merchants_count} merchant{plan.merchants_count !== 1 ? 's' : ''} active — cannot delete.
                            </p>
                            <button
                                onClick={() => onDeleteToggle(null)}
                                className="px-4 py-1.5 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Close
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => destroy(`/admin/plans/${plan.id}`, { preserveScroll: true })}
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
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Main page ───────────────────────────────────────────────────── */

export default function PlansTab({ plans, stats }) {
    const [slideOver, setSlideOver] = useState(null); // null | { mode:'create'|'edit', plan? }
    const [confirmDelete, setConfirmDelete] = useState(null); // plan id

    const openCreate = useCallback(() => setSlideOver({ mode: 'create' }), []);
    const openEdit = useCallback((plan) => setSlideOver({ mode: 'edit', plan }), []);
    const closeSlideOver = useCallback(() => setSlideOver(null), []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Plans</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage recurring and one-time billing plans</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">
                    <Plus size={16} className="mr-2" />
                    Add Plan
                </button>
            </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Plans',        value: stats.total_plans,                icon: CreditCard,  color: 'text-primary-500' },
                        { label: 'Paid Plans',          value: stats.paid_plans,                 icon: DollarSign,  color: 'text-green-500' },
                        { label: 'Merchants on Plans', value: stats.total_merchants_on_plans,    icon: Users,       color: 'text-secondary-500' },
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

                {/* Plans grid */}
                {plans.length === 0 ? (
                    <div className="card flex flex-col items-center justify-center py-16 gap-3">
                        <CreditCard size={36} className="text-gray-300 dark:text-gray-600" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">No plans yet</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Click "New Plan" to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                            <PlanCard
                                key={plan.id}
                                plan={plan}
                                onEdit={openEdit}
                                isConfirming={confirmDelete === plan.id}
                                onDeleteToggle={(id) => setConfirmDelete(id === confirmDelete ? null : id)}
                            />
                        ))}
                    </div>
                )}

            {/* Create / Edit Modal */}
            <Modal
                open={slideOver !== null}
                onClose={closeSlideOver}
                title={slideOver?.mode === 'edit' ? `Edit Plan — ${slideOver.plan?.name}` : 'Create New Plan'}
            >
                {slideOver && (
                    <PlanForm
                        key={slideOver.plan?.id ?? 'create'}
                        plan={slideOver.mode === 'edit' ? slideOver.plan : null}
                        mode={slideOver.mode}
                        onClose={closeSlideOver}
                    />
                )}
            </Modal>
        </div>
    );
}
