import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage, router, useForm } from '@inertiajs/react';
import { useAdminToast } from '@/Admin/Components/AdminToast';
import {
    MessageCircle, Send, Paperclip, Smile, MoreVertical,
    RefreshCw, User, Clock, AlertTriangle, CheckCircle2,
    XCircle, Volume2, VolumeX, Flag, Ban, Workflow,
    ChevronRight, Search, Filter, X, Wifi, WifiOff,
    AlertCircle, Info, Settings, SlidersHorizontal,
    Bell, PanelRightClose, PanelRightOpen, Copy, Check, Activity
} from 'lucide-react';
import { Link } from '@inertiajs/react';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const STATUS_LABELS = {
    active:    'Active',
    waiting:   'Waiting',
    ended:     'Ended',
    converted: 'Converted',
    spam:      'Spam',
    blocked:   'Blocked',
    muted:     'Muted',
};

const STATUS_COLORS = {
    active:    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    waiting:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    ended:     'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    converted: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    spam:      'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    blocked:   'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    muted:     'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const STATUS_ACTIVE_BORDER = {
    active:    'border-l-green-500',
    waiting:   'border-l-yellow-500',
    ended:     'border-l-gray-400',
    converted: 'border-l-blue-500',
    spam:      'border-l-orange-500',
    blocked:   'border-l-red-500',
    muted:     'border-l-gray-400',
};

// ─────────────────────────────────────────────────────────────
// HELPER / UTILITY
// ─────────────────────────────────────────────────────────────

function timestamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function fullTimestamp(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function initials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
}

function shouldGroupWithPrev(messages, idx) {
    if (idx === 0) return false;
    const cur = messages[idx];
    const prev = messages[idx - 1];
    if (cur.sender_type !== prev.sender_type) return false;
    if (cur.is_internal_note !== prev.is_internal_note) return false;
    const diff = Math.abs(new Date(cur.created_at) - new Date(prev.created_at));
    return diff < 3 * 60 * 1000; // 3 min threshold
}

// ─────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────

function Avatar({ name, src, size = 40, cls = '' }) {
    const style = { width: size, height: size, minWidth: size };
    if (src) {
        return (
            <img
                src={src}
                alt={name ?? 'User'}
                className={`rounded-full object-cover flex-shrink-0 ${cls}`}
                style={style}
            />
        );
    }
    return (
        <div
            role="img"
            aria-label={name}
            className={`rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 flex items-center justify-center font-semibold flex-shrink-0 ${cls}`}
            style={{ ...style, fontSize: size * 0.4 }}
        >
            {initials(name)}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// KPI STRIP
// ─────────────────────────────────────────────────────────────

const KPI_CARDS = [
    { key: 'total',     label: 'Total',     color: 'text-gray-900 dark:text-white' },
    { key: 'active',    label: 'Active',    color: 'text-green-600 dark:text-green-400' },
    { key: 'waiting',   label: 'Waiting',   color: 'text-yellow-600 dark:text-yellow-400' },
    { key: 'ended',     label: 'Ended',     color: 'text-gray-500 dark:text-gray-400' },
    { key: 'unread',    label: 'Unread',    color: 'text-primary-600 dark:text-primary-400' },
];

function KpiStrip({ kpis, reverbStatus, reverbError }) {
    const [copiedError, setCopiedError] = useState(false);

    const handleCopyError = () => {
        if (reverbError) {
            navigator.clipboard.writeText(reverbError);
            setCopiedError(true);
            setTimeout(() => setCopiedError(false), 2000);
        }
    };

    return (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
            {KPI_CARDS.map(({ key, label, color }) => (
                <div key={key} className="card-base p-4 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        {label}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${color}`}>
                        {(kpis?.[key] ?? 0).toLocaleString()}
                    </span>
                </div>
            ))}
            
            {/* Reverb Connection Status Card */}
            <div className="card-base p-4 rounded-xl flex flex-col gap-1 col-span-3 sm:col-span-1 border border-primary-500/20 bg-primary-50/10 dark:bg-primary-900/10 relative overflow-hidden group">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[10px] items-center gap-1 font-semibold flex uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        <Activity size={12} className={reverbStatus === 'connected' ? 'text-green-500' : reverbStatus === 'error' ? 'text-red-500' : 'text-yellow-500'} /> 
                        Reverb
                    </span>
                    {reverbStatus === 'error' && (
                        <button 
                            onClick={handleCopyError}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 p-1 rounded transition-colors"
                            title="Copy Reverb Error"
                        >
                            {copiedError ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    )}
                </div>

                <div className="flex flex-col mt-0.5">
                    <span className={`text-sm font-bold capitalize ${
                        reverbStatus === 'connected' ? 'text-green-600 dark:text-green-400' : 
                        reverbStatus === 'error' ? 'text-red-600 dark:text-red-400' : 
                        'text-yellow-600 dark:text-yellow-400'
                    }`}>
                        {reverbStatus || 'Connecting...'}
                    </span>
                    {reverbStatus === 'error' && reverbError && (
                        <p className="text-[9px] text-red-500 truncate mt-1 opacity-70 group-hover:opacity-100 transition-opacity" title={reverbError}>
                            {reverbError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// SYNC STATUS BADGE
// ─────────────────────────────────────────────────────────────

function SyncBadge({ mode, lastSyncedAt }) {
    const live = mode === 'live';
    return (
        <span className={[
            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase',
            live
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        ].join(' ')}>
            {live ? <Wifi size={10} /> : <WifiOff size={10} />}
            {live ? 'Live' : 'Manual Refresh'}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────
// CONVERSATION LIST ITEM
// ─────────────────────────────────────────────────────────────

function ConversationItem({ conv, isActive, onClick }) {
    return (
        <button
            onClick={onClick}
            className={[
                'w-full text-left px-3 py-3.5 border-l-4 rounded-md transition-colors duration-150 relative',
                isActive
                    ? `${STATUS_ACTIVE_BORDER[conv.status] ?? 'border-l-primary-500'} bg-primary-50 dark:bg-primary-900/20`
                    : `border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800`,
            ].join(' ')}
            aria-pressed={isActive}
        >
            <div className="flex items-start gap-3">
                <Avatar name={conv.customer_name} src={conv.customer_avatar} size={40} />
                <div className="flex-1 min-w-0">
                    {/* Row 1: name + timestamp */}
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {conv.customer_name}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 tabular-nums">
                            {timestamp(conv.last_message_at)}
                        </span>
                    </div>
                    {/* Row 2: subject + status */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                            {conv.subject}
                        </span>
                        <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[conv.status]}`}>
                            {STATUS_LABELS[conv.status] ?? conv.status}
                        </span>
                    </div>
                    {/* Row 3: preview */}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {conv.last_message_preview ?? 'No messages yet.'}
                        </span>
                        {conv.unread_count > 0 && (
                            <span className="flex-shrink-0 min-w-[16px] text-center bg-primary-600 text-white text-[10px] font-bold rounded-full px-1.5 py-px">
                                {conv.unread_count}
                            </span>
                        )}
                        {conv.is_muted && <VolumeX size={10} className="flex-shrink-0 text-gray-400" />}
                    </div>
                </div>
            </div>
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// MESSAGE BUBBLE
// ─────────────────────────────────────────────────────────────

function MessageBubble({ message, grouped }) {
    const isAgent = message.sender_type === 'agent';
    const isCustomer = message.sender_type === 'customer';
    const isSystem = message.sender_type === 'system';
    const isNote = message.is_internal_note;

    if (isSystem) {
        return (
            <div className="flex justify-center my-2">
                <span className="text-[11px] text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {message.body}
                </span>
            </div>
        );
    }

    if (isNote) {
        return (
            <div className="flex justify-center my-2 w-full">
                <div className="max-w-[85%] w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-2.5">
                    {!grouped && (
                        <div className="flex items-center gap-1.5 mb-1">
                            <Info size={12} className="text-yellow-600 dark:text-yellow-400" />
                            <span className="text-[11px] font-semibold text-yellow-700 dark:text-yellow-300">
                                Internal note · {message.sender_name}
                            </span>
                        </div>
                    )}
                    <p className="text-sm text-yellow-900 dark:text-yellow-100 leading-relaxed whitespace-pre-wrap break-words">
                        {message.body}
                    </p>
                    <div className="mt-1 text-[11px] text-yellow-600 dark:text-yellow-400 text-right">
                        {fullTimestamp(message.created_at)}
                    </div>
                </div>
            </div>
        );
    }

    const agentSide = isAgent;
    const bubbleCls = agentSide
        ? 'bg-primary-600 text-white rounded-xl rounded-br-sm'
        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl rounded-bl-sm';

    return (
        <div className={`flex items-end gap-2.5 my-1 ${agentSide ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar placeholder: hidden when grouped */}
            <div style={{ width: 32, flexShrink: 0 }}>
                {!grouped && (
                    <Avatar name={message.sender_name} size={32} />
                )}
            </div>

            <div className={`flex flex-col ${agentSide ? 'items-end' : 'items-start'} max-w-[65%]`}>
                {!grouped && (
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 mb-1 px-1">
                        {message.sender_name}
                    </span>
                )}

                {/* Attachments */}
                {message.attachments?.map((att, idx) => (
                    <div key={idx} className={`mb-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 ${att.preview_url ? '' : 'px-3 py-2 bg-white dark:bg-gray-700'}`}>
                        {att.preview_url ? (
                            <a href={att.preview_url} target="_blank" rel="noreferrer">
                                <img src={att.preview_url} alt={att.name} className="max-w-[260px] max-h-[180px] object-cover" />
                            </a>
                        ) : (
                            <div className="flex items-center gap-2 text-sm">
                                <Paperclip size={14} className="flex-shrink-0 text-gray-400" />
                                <span className="truncate max-w-[140px] text-gray-700 dark:text-gray-300">{att.name}</span>
                                {att.size && (
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                                        {(att.size / 1024).toFixed(0)}KB
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Text body */}
                {message.body && (
                    <div className={`px-4 py-3 ${bubbleCls}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                )}

                <span className={`text-[11px] mt-0.5 px-1 ${agentSide ? 'text-right text-gray-400 dark:text-gray-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {fullTimestamp(message.created_at)}
                    {agentSide && message.is_read && (
                        <CheckCircle2 size={10} className="inline ml-1 text-primary-400" />
                    )}
                </span>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// STATE BANNER (non-active sessions)
// ─────────────────────────────────────────────────────────────

function StateBanner({ conversation, onRestore }) {
    const status = conversation?.status;
    if (!status || status === 'active') return null;

    const configMap = {
        waiting: {
            icon: Clock,
            cls: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
            text: 'This conversation is waiting for a response.',
            action: { label: 'Mark active', do: 'active' },
        },
        ended: {
            icon: XCircle,
            cls: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
            text: 'This conversation has ended.',
            action: { label: 'Reopen', do: 'restore' },
        },
        converted: {
            icon: Workflow,
            cls: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
            text: 'Converted to a follow-up workflow.',
            action: null,
        },
        spam: {
            icon: AlertTriangle,
            cls: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
            text: 'This conversation is marked as spam.',
            action: { label: 'Not spam', do: 'unspam' },
        },
        blocked: {
            icon: Ban,
            cls: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
            text: 'Participant is blocked.',
            action: { label: 'Restore', do: 'restore' },
        },
        muted: {
            icon: VolumeX,
            cls: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300',
            text: 'This conversation is muted.',
            action: { label: 'Unmute', do: 'unmute' },
        },
    };

    const cfg = configMap[status];
    if (!cfg) return null;
    const Icon = cfg.icon;

    return (
        <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl mx-4 mb-3 text-sm ${cfg.cls}`}>
            <Icon size={16} className="flex-shrink-0" />
            <span className="flex-1">{cfg.text}</span>
            {cfg.action && (
                <button
                    onClick={() => onRestore(cfg.action.do)}
                    className="text-xs font-semibold underline underline-offset-2 hover:no-underline"
                >
                    {cfg.action.label}
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// DESTRUCTIVE CONFIRM MODAL
// ─────────────────────────────────────────────────────────────

const DESTRUCTIVE_DEFINITIONS = {
    end: {
        title: 'End conversation',
        desc: 'This will permanently close the conversation. The customer will not be able to send new messages.',
        actionLabel: 'End conversation',
    },
    spam: {
        title: 'Mark as spam',
        desc: 'This will hide the conversation from your inbox and flag it as spam.',
        actionLabel: 'Mark as spam',
    },
    block: {
        title: 'Block participant',
        desc: 'This will block this participant from sending future messages to your team.',
        actionLabel: 'Block participant',
    },
};

function ConfirmModal({ action, onConfirm, onCancel }) {
    const def = DESTRUCTIVE_DEFINITIONS[action];
    if (!def) return null;

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{def.title}</h2>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{def.desc}</p>
                    <div className="flex items-center justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn-danger"
                        >
                            {def.actionLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// SYNC SETTINGS PANEL
// ─────────────────────────────────────────────────────────────

function SyncSettingsPanel({ settings, onSave, onClose }) {
    const [form, setForm] = useState(() => ({ ...settings }));
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const toast = useAdminToast();

    const handleChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
    };

    const validate = () => {
        const errs = {};
        const interval = Number(form.manual_refresh_interval_seconds);
        if (!Number.isInteger(interval) || interval < 3 || interval > 60) {
            errs.manual_refresh_interval_seconds = 'Must be between 3 and 60 seconds.';
        }
        const fb = Number(form.fallback_threshold_seconds);
        if (!Number.isInteger(fb) || fb < 3 || fb > 300) {
            errs.fallback_threshold_seconds = 'Must be between 3 and 300 seconds.';
        }
        const rec = Number(form.recovery_threshold_seconds);
        if (!Number.isInteger(rec) || rec < 3 || rec > 300) {
            errs.recovery_threshold_seconds = 'Must be between 3 and 300 seconds.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        try {
            const res = await fetch('/admin/live-chat/sync-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document?.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    ...form,
                    manual_refresh_interval_seconds: Number(form.manual_refresh_interval_seconds),
                    fallback_threshold_seconds: Number(form.fallback_threshold_seconds),
                    recovery_threshold_seconds: Number(form.recovery_threshold_seconds),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? 'Failed to save.');
            toast.success('Sync settings saved.');
            onSave(data.syncSettings);
        } catch (err) {
            toast.error(err.message ?? 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    function ToggleRow({ label, description, fieldKey }) {
        return (
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={!!form[fieldKey]}
                    onChange={(e) => handleChange(fieldKey, e.target.checked)}
                    className="mt-0.5 rounded text-primary-600 focus:ring-primary-500"
                />
                <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
                </div>
            </label>
        );
    }

    function NumberInput({ label, description, fieldKey, min, max }) {
        return (
            <div>
                <label className="form-label">{label}</label>
                <input
                    type="number"
                    min={min}
                    max={max}
                    value={form[fieldKey] ?? ''}
                    onChange={(e) => handleChange(fieldKey, e.target.value === '' ? '' : Number(e.target.value))}
                    className={`form-input w-32 ${errors[fieldKey] ? 'border-red-400 dark:border-red-500' : ''}`}
                />
                {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>}
                {errors[fieldKey] && <p className="form-error">{errors[fieldKey]}</p>}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-primary-600 dark:text-primary-400" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Chat Sync Settings</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Close">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="card-base rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Realtime</h3>
                            <ToggleRow
                                fieldKey="realtime_enabled"
                                label="Enable realtime (live) mode"
                                description="Messages are delivered without manual refreshes."
                            />
                            <ToggleRow
                                fieldKey="auto_fallback_enabled"
                                label="Auto-fallback to manual refresh when realtime is unstable"
                                description="Switches to polling mode if the live connection degrades."
                            />
                            <ToggleRow
                                fieldKey="auto_return_realtime"
                                label="Auto-return to realtime after stability period"
                            />
                        </div>

                        <div className="card-base rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Intervals &amp; Thresholds</h3>
                            <NumberInput
                                fieldKey="manual_refresh_interval_seconds"
                                label="Manual refresh interval (seconds)"
                                description="Faster intervals = more server requests. Recommended: 10–15s."
                                min={3}
                                max={60}
                            />
                            <NumberInput
                                fieldKey="fallback_threshold_seconds"
                                label="Fallback threshold (seconds)"
                                description="How long until instability triggers a fallback to manual mode."
                                min={3}
                                max={300}
                            />
                            <NumberInput
                                fieldKey="recovery_threshold_seconds"
                                label="Recovery threshold before returning to live (seconds)"
                                description="How long stable connectivity must last before returning to live mode."
                                min={3}
                                max={300}
                            />
                        </div>

                        <div className="card-base rounded-xl p-4 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Status Badge Visibility</h3>
                            <ToggleRow
                                fieldKey="show_status_badge_agents"
                                label="Show sync status badge to agents"
                            />
                            <ToggleRow
                                fieldKey="show_status_badge_customers"
                                label="Show sync status badge to customers"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                                {saving ? (
                                    <RefreshCw size={14} className="animate-spin" />
                                ) : null}
                                {saving ? 'Saving…' : 'Save settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// WELCOME SCREEN
// ─────────────────────────────────────────────────────────────

function WelcomeScreen({ recentConversations, onSelect }) {
    const recent = (recentConversations || []).slice(0, 3);
    
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto bg-transparent relative min-h-0 w-full" style={{ zIndex: 1 }}>
            {/* Subtle background dot pattern for both themes */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-5" style={{ backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
            
            <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
                <div className="flex-shrink-0 flex items-center justify-center w-[60px] h-[60px] rounded-2xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-8 mt-4 shadow-sm border border-primary-200 dark:border-primary-800/50 animate-[bounce_2s_infinite]">
                    <MessageCircle size={28} />
                </div>
                
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Welcome to Chat Command</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-md">Select a conversation from the sidebar to start providing world-class support.</p>

                {/* Minimalistic Feature Blocks */}
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-14">
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                            <Bell size={16} />
                        </div>
                        <span className="text-sm font-medium">Sound Alerts</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                            <Ban size={16} />
                        </div>
                        <span className="text-sm font-medium">Block Users</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                            <Flag size={16} />
                        </div>
                        <span className="text-sm font-medium">Spam Control</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-400">
                        <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                            <Search size={16} />
                        </div>
                        <span className="text-sm font-medium">Global Search</span>
                    </div>
                </div>

                <div className="w-full max-w-lg flex flex-col items-center">
                    <div className="flex items-center gap-4 w-full mb-8 relative">
                        <hr className="flex-1 border-gray-200 dark:border-gray-800" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Recent Activity</span>
                        <hr className="flex-1 border-gray-200 dark:border-gray-800" />
                    </div>
                    
                    {recent.length > 0 ? (
                        <div className="relative w-full pb-8 group h-28 flex justify-center">
                           {recent.map((conv, idx) => {
                               const styles = {
                                  0: "z-30 translate-y-0 scale-100 opacity-100",
                                  1: "z-20 translate-y-3 scale-[0.95] opacity-90 group-hover:translate-y-[84px] group-hover:scale-100 group-hover:opacity-100",
                                  2: "z-10 translate-y-6 scale-[0.90] opacity-75 group-hover:translate-y-[168px] group-hover:scale-100 group-hover:opacity-100",
                               };
                               return (
                                   <div 
                                      key={conv.id} 
                                      onClick={() => onSelect(conv.id)} 
                                      className={`absolute top-0 left-0 right-0 w-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer ${styles[idx] || 'hidden'}`}
                                   >
                                       <div className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:border-primary-500/50 hover:shadow-primary-500/10 flex items-center justify-between mx-auto max-w-md">
                                           <div className="flex items-center gap-3">
                                                <Avatar name={conv.customer_name} src={conv.customer_avatar} size={42} cls="text-primary-700 bg-primary-100 dark:text-primary-300 dark:bg-primary-900/40" />
                                                <div className="text-left w-24 sm:w-32 truncate">
                                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">{conv.customer_name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Clock size={10} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                                        <span className="text-[10px] text-gray-400">{timestamp(conv.last_message_at)}</span>
                                                    </div>
                                                </div>
                                           </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider ${STATUS_COLORS[conv.status]}`}>
                                                    {STATUS_LABELS[conv.status]}
                                                </span>
                                                <button className="btn-primary !rounded-xl !py-1.5 !px-3 font-semibold text-[11px] flex items-center gap-1">
                                                    Jump In <ChevronRight size={12} />
                                                </button>
                                            </div>
                                       </div>
                                   </div>
                               );
                           })}
                        </div>
                    ) : (
                        <div className="py-2 text-sm text-gray-400 dark:text-gray-500 italic pb-8">
                            No recent activity found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
            <MessageCircle size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// NEW MESSAGE INDICATOR
// ─────────────────────────────────────────────────────────────

function NewMessagesIndicator({ count, onClick }) {
    if (!count) return null;
    return (
        <button
            onClick={onClick}
            className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5"
        >
            <ChevronRight size={12} className="rotate-90" />
            {count} new message{count > 1 ? 's' : ''} — scroll down
        </button>
    );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function LiveChatIndex() {
    const {
        conversations: initialConversations,
        filters: initialFilters,
        kpis: initialKpis,
        syncSettings: initialSyncSettings,
    } = usePage().props;
    const { auth } = usePage().props;
    const canManage = auth?.user?.role === 'super_admin'
        || auth?.user?.permissions?.includes('live_chat.manage')
        || auth?.user?.permissions?.includes('*');

    const toast = useAdminToast();

    // Conversation list state
    const [conversations, setConversations] = useState(initialConversations?.data ?? []);
    const [statusFilter, setStatusFilter] = useState(initialFilters?.status ?? 'active');
    const [search, setSearch] = useState(initialFilters?.search ?? '');
    const [kpis, setKpis] = useState(initialKpis ?? {});
    const [syncSettings, setSyncSettings] = useState(initialSyncSettings ?? {});

    // Sync state with props when navigating via Inertia
    useEffect(() => {
        setConversations(initialConversations?.data ?? []);
        setStatusFilter(initialFilters?.status ?? 'active');
        setSearch(initialFilters?.search ?? '');
        setKpis(initialKpis ?? {});
        // We explicitly omit syncSettings here because Inertia partial reloads (like poll updates)
        // would pass the stale syncSettings from the initial page load, overwriting our local
        // state that gets updated when the admin saves the settings panel.
    }, [initialConversations, initialFilters, initialKpis]);

    // Active thread state
    const [activeConvId, setActiveConvId] = useState(null);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [threadError, setThreadError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [syncMode, setSyncMode] = useState(syncSettings?.realtime_enabled ? 'live' : 'manual');
    const [newMessagesBelow, setNewMessagesBelow] = useState(0);
    const [lastMessageId, setLastMessageId] = useState(0);

    // Composer
    const [draftBody, setDraftBody] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [sending, setSending] = useState(false);
    const textareaRef = useRef(null);
    const threadRef = useRef(null);
    const atBottomRef = useRef(true);

    // Modals & Panels
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const sidebarResizing = useRef(false);
    const layoutXRefs = useRef({ startX: 0, startWidth: 320 });
    const [showRightPanel, setShowRightPanel] = useState(true);
    const [confirmAction, setConfirmAction] = useState(null);
    const [showSyncSettings, setShowSyncSettings] = useState(false);

    // Reverb connection state
    const [reverbStatus, setReverbStatus] = useState('connecting'); // 'connecting', 'connected', 'error', 'disconnected'
    const [reverbError, setReverbError] = useState(null);

    // Initial check for Realtime enablement & Auto-Fallback
    useEffect(() => {
        if (!syncSettings?.realtime_enabled) {
            setReverbStatus('disconnected');
            setReverbError('Realtime WebSocket sync is disabled in Sync Settings.');
            setSyncMode('manual');
            return;
        }

        setSyncMode('live');
        setReverbStatus('connecting');

        let fallbackTimer = null;
        let recoveryTimer = null;

        const handleSuccess = () => {
            setReverbStatus('connected');
            setReverbError(null);
            
            // Auto Return logic
            setSyncMode(prev => {
                if (prev === 'manual' && syncSettings?.auto_return_realtime) {
                    if (!recoveryTimer) {
                        recoveryTimer = setTimeout(() => {
                           setSyncMode('live');
                        }, (syncSettings?.recovery_threshold_seconds || 20) * 1000);
                    }
                    return 'manual'; 
                }
                return 'live';
            });
            if (fallbackTimer) clearTimeout(fallbackTimer);
        };

        const handleError = (errMessage) => {
            setReverbStatus('error');
            setReverbError(errMessage);
            if (recoveryTimer) { clearTimeout(recoveryTimer); recoveryTimer = null; }

            // Auto Fallback logic
            if (syncSettings?.auto_fallback_enabled) {
                 if (!fallbackTimer) {
                     fallbackTimer = setTimeout(() => {
                         setSyncMode('manual');
                     }, (syncSettings?.fallback_threshold_seconds || 20) * 1000);
                 }
            } else {
                 setSyncMode('live'); // Force stay broken if fallback disabled
            }
        };

        // We will formally connect Laravel Echo in the next phase.
        // For UI purposes now, simulate an attempt to connect or basic setup:
        const timer = setTimeout(() => {
            // Placeholder: When Echo is installed, we bind to connection events here.
            try {
                if (window.Echo) {
                    handleSuccess();
                } else {
                    handleError('Echo client not found. Connection to reverb refused.');
                }
            } catch (err) {
                handleError(err.message || 'Unknown Reverb Connection Error');
            }
        }, 1500);

        return () => {
            clearTimeout(timer);
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (recoveryTimer) clearTimeout(recoveryTimer);
        };
    }, [syncSettings, setSyncMode]);

    // Manual refresh
    const refreshTimerRef = useRef(null);
    const [nextRefreshIn, setNextRefreshIn] = useState(0);

    // ── Helper: is the thread scrolled near bottom? ──
    const checkAtBottom = useCallback(() => {
        const el = threadRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }, []);

    const scrollToBottom = useCallback((smooth = false) => {
        const el = threadRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
        setNewMessagesBelow(0);
    }, []);

    // ── Load thread messages ──
    const loadThread = useCallback(async (convId) => {
        if (!convId) return;
        setLoadingThread(true);
        setThreadError(null);
        try {
            const res = await fetch(`/admin/live-chat/conversations/${convId}/messages`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const data = await res.json();
            setMessages(data.messages ?? []);
            setActiveConv(data.conversation ?? null);
            setLastSyncedAt(data.synced_at);
            const ids = (data.messages ?? []).map((m) => m.id);
            setLastMessageId(ids.length ? Math.max(...ids) : 0);
            atBottomRef.current = true;
            setTimeout(() => scrollToBottom(false), 50);
        } catch (err) {
            setThreadError('Failed to load messages. ' + err.message);
        } finally {
            setLoadingThread(false);
        }
    }, [scrollToBottom]);

    // ── Poll for new messages (manual mode) ──
    const pollMessages = useCallback(async () => {
        if (!activeConvId) return;
        try {
            const res = await fetch(`/admin/live-chat/conversations/${activeConvId}/poll?since_id=${lastMessageId}`, {
                headers: { Accept: 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return;
            const data = await res.json();
            const newMsgs = data.messages ?? [];
            if (newMsgs.length > 0) {
                const wasAtBottom = atBottomRef.current;
                setMessages((prev) => {
                    const existingIds = new Set(prev.map((m) => m.id));
                    const fresh = newMsgs.filter((m) => !existingIds.has(m.id));
                    if (!fresh.length) return prev;
                    return [...prev, ...fresh];
                });
                const maxId = Math.max(...newMsgs.map((m) => m.id));
                setLastMessageId((prev) => Math.max(prev, maxId));
                setTimeout(() => scrollToBottom(true), 50);
            }
            setLastSyncedAt(data.synced_at);
        } catch (_) {
            // silent poll failure; retry next cycle
        }
    }, [activeConvId, lastMessageId, scrollToBottom]);

    // ── Start / stop manual refresh timer ──
    const startRefreshTimer = useCallback(() => {
        const interval = syncSettings?.manual_refresh_interval_seconds ?? 12;
        setNextRefreshIn(interval);
        let remaining = interval;
        refreshTimerRef.current = setInterval(() => {
            remaining -= 1;
            setNextRefreshIn(remaining);
            if (remaining <= 0) {
                remaining = interval;
                setNextRefreshIn(interval);
                pollMessages();
            }
        }, 1000);
    }, [syncSettings?.manual_refresh_interval_seconds, pollMessages]);

    const stopRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (activeConvId && syncMode === 'manual') {
            startRefreshTimer();
        } else {
            stopRefreshTimer();
        }
        return stopRefreshTimer;
    }, [activeConvId, syncMode, startRefreshTimer, stopRefreshTimer]);

    // ── Select conversation ──
    const selectConversation = useCallback((convId) => {
        setActiveConvId(convId);
        setMessages([]);
        setDraftBody('');
        setIsInternalNote(false);
        setNewMessagesBelow(0);
        setLastMessageId(0);
        loadThread(convId);
    }, [loadThread]);

    // ── Handle new messages indicator ──
    useEffect(() => {
        const el = threadRef.current;
        if (!el) return;
        const handleScroll = () => {
            atBottomRef.current = checkAtBottom();
            if (atBottomRef.current) setNewMessagesBelow(0);
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [checkAtBottom]);

    // ── Composer ──
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        const body = draftBody.trim();
        if (!body || sending || !activeConvId) return;
        setSending(true);
        try {
            const res = await fetch(`/admin/live-chat/conversations/${activeConvId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document?.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ body, is_internal_note: isInternalNote }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.message ?? `Error ${res.status}`);
            }
            const data = await res.json();
            setMessages((prev) => [...prev, data.message]);
            setDraftBody('');
            setIsInternalNote(false);
            // Reset textarea height
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            setTimeout(() => scrollToBottom(true), 50);
        } catch (err) {
            toast.error(err.message ?? 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    // ── State transitions ──
    const handleAction = (action) => {
        if (['end', 'spam', 'block'].includes(action)) {
            setConfirmAction(action);
        } else {
            executeAction(action);
        }
    };

    const executeAction = async (action) => {
        if (!activeConvId) return;
        try {
            const res = await fetch(`/admin/live-chat/conversations/${activeConvId}/state`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document?.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    Accept: 'application/json',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ action }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data?.message ?? `Error ${res.status}`);
            }
            const data = await res.json();
            setActiveConv(data.conversation);
            if (data.system_message) {
                setMessages((prev) => [...prev, data.system_message]);
                setTimeout(() => scrollToBottom(true), 50);
            }
            // Refresh conversation list entry
            setConversations((prev) =>
                prev.map((c) => (c.id === activeConvId ? data.conversation : c)),
            );
            toast.success(`Conversation marked as ${data.conversation?.status}.`);
        } catch (err) {
            toast.error(err.message ?? 'Action failed.');
        } finally {
            setConfirmAction(null);
        }
    };

    // ── Resizer ──
    const handleSidebarMouseMove = useCallback((e) => {
        if (!sidebarResizing.current) return;
        const dx = e.clientX - layoutXRefs.current.startX;
        const newWidth = Math.max(250, Math.min(layoutXRefs.current.startWidth + dx, 800));
        setSidebarWidth(newWidth);
    }, []);

    const handleSidebarMouseUp = useCallback(() => {
        sidebarResizing.current = false;
        document.removeEventListener('mousemove', handleSidebarMouseMove);
        document.removeEventListener('mouseup', handleSidebarMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, [handleSidebarMouseMove]);

    const handleSidebarMouseDown = (e) => {
        sidebarResizing.current = true;
        layoutXRefs.current = { startX: e.clientX, startWidth: sidebarWidth };
        document.addEventListener('mousemove', handleSidebarMouseMove);
        document.addEventListener('mouseup', handleSidebarMouseUp);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
    };

    // ── Filter / search ──
    const handleFilterChange = (status) => {
        setStatusFilter(status);
        router.get('/admin/live-chat', { status, search }, { preserveState: true, preserveScroll: true });
    };

    // ── Global Inbox Refresh (Auto & Manual) ──
    const handleRefreshInbox = useCallback(() => {
        router.reload({
            only: ['conversations', 'kpis'],
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    useEffect(() => {
        if (syncMode === 'live') return; // Only poll if we are actively in manual mode (or fallen back to it)
        const intervalSecs = syncSettings?.manual_refresh_interval_seconds ?? 12;
        const timer = setInterval(() => {
            handleRefreshInbox();
        }, intervalSecs * 1000);
        return () => clearInterval(timer);
    }, [syncSettings?.manual_refresh_interval_seconds, syncMode, handleRefreshInbox]);

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/live-chat', { status: statusFilter, search }, { preserveState: true, preserveScroll: true });
    };

    // ── Textarea auto-height ──
    const handleTextareaChange = (e) => {
        setDraftBody(e.target.value);
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            const maxH = 112;
            ta.style.height = Math.min(ta.scrollHeight, maxH) + 'px';
            ta.style.overflowY = ta.scrollHeight > maxH ? 'auto' : 'hidden';
        }
    };

    const STATUS_FILTERS = ['all', 'active', 'waiting', 'ended', 'spam', 'blocked', 'muted'];

    const isComposerDisabled = !canManage || (activeConv && !['active', 'waiting', 'muted'].includes(activeConv?.status));

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────

    return (
        <AdminLayout fullHeight>
            <div className="flex flex-col h-full overflow-hidden px-6 pt-5 pb-4" style={{ minHeight: 0 }}>
                {/* Page header */}
                <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Live Chat</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage customer conversations</p>
                    </div>
                    {canManage && (
                        <button
                            onClick={() => setShowSyncSettings(true)}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <SlidersHorizontal size={14} />
                            Sync Settings
                        </button>
                    )}
                </div>

                {/* KPI Strip */}
                <KpiStrip kpis={kpis} reverbStatus={reverbStatus} reverbError={reverbError} />

                {/* Main 3-pane shell */}
                <div className="flex flex-1 min-h-0 gap-0 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900 shadow-sm">

                    {/* ── LEFT PANEL: Conversation inbox ── */}
                    <div 
                        style={{ width: sidebarWidth }}
                        className="relative flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    >
                        {/* Drag Handle */}
                        <div
                            onMouseDown={handleSidebarMouseDown}
                            className="absolute top-0 right-[-3px] bottom-0 w-[6px] cursor-col-resize hover:bg-primary-500/50 z-10 transition-colors"
                        ></div>

                        {/* Search */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <form onSubmit={handleSearch} className="relative flex-1">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search conversations…"
                                    className="form-input pl-9 text-xs py-1.5 h-8 w-full"
                                />
                            </form>
                            <button
                                type="button"
                                onClick={handleRefreshInbox}
                                className="p-1.5 text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                                title="Refresh Inbox"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Status filters */}
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                            <div className="flex gap-1 whitespace-nowrap">
                                {STATUS_FILTERS.map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => handleFilterChange(s)}
                                        className={[
                                            'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                                            statusFilter === s
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600',
                                        ].join(' ')}
                                    >
                                        {s === 'all' ? 'All' : STATUS_LABELS[s] ?? s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                            {conversations.length === 0 ? (
                                <EmptyState message="No conversations found for this filter." />
                            ) : (
                                conversations.map((conv) => (
                                    <ConversationItem
                                        key={conv.id}
                                        conv={conv}
                                        isActive={conv.id === activeConvId}
                                        onClick={() => selectConversation(conv.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* ── CENTER PANEL: Thread ── */}
                    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-white dark:bg-gray-900 border-l border-transparent z-10 relative">
                        {!activeConvId ? (
                            <WelcomeScreen recentConversations={conversations} onSelect={selectConversation} />
                        ) : (
                            <>
                                {/* Thread header */}
                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0" style={{ minHeight: 64 }}>
                                    <Avatar name={activeConv?.customer_name} size={36} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                                {activeConv?.customer_name ?? '…'}
                                            </span>
                                            {activeConv && (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[activeConv.status]}`}>
                                                    {STATUS_LABELS[activeConv.status]}
                                                </span>
                                            )}
                                            {activeConv && syncSettings?.show_status_badge_agents !== false && (
                                                <SyncBadge mode={syncMode} lastSyncedAt={lastSyncedAt} />
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate">
                                            {activeConv?.customer_email ?? ''}
                                            {lastSyncedAt && syncMode === 'manual' && (
                                                <span className="ml-2">
                                                    · Updated {timestamp(lastSyncedAt)}
                                                    {nextRefreshIn > 0 && ` · Next in ${nextRefreshIn}s`}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thread actions */}
                                    {canManage && activeConv && (
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            {syncMode === 'manual' && (
                                                <button
                                                    onClick={() => pollMessages()}
                                                    title="Refresh now"
                                                    className="btn-secondary p-1.5 !px-1.5 !py-1.5"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                            {activeConv.status === 'active' && (
                                                <>
                                                    {activeConv.is_muted ? (
                                                        <button onClick={() => handleAction('unmute')} className="btn-secondary p-1.5 !px-1.5 !py-1.5" title="Unmute">
                                                            <Volume2 size={14} />
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleAction('mute')} className="btn-secondary p-1.5 !px-1.5 !py-1.5" title="Mute">
                                                            <VolumeX size={14} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleAction('spam')} className="btn-sm-warning p-1.5 !px-1.5 !py-1.5" title="Mark spam">
                                                        <Flag size={14} />
                                                    </button>
                                                    <button onClick={() => handleAction('end')} className="btn-sm-danger p-1.5 !px-1.5 !py-1.5" title="End conversation">
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            )}
                                            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                            <button
                                                onClick={() => setShowRightPanel((p) => !p)}
                                                className={`p-1.5 rounded-md transition-colors ${showRightPanel ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                                title={showRightPanel ? "Hide details" : "Show details"}
                                            >
                                                {showRightPanel ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Sync error / retry banner */}
                                {threadError && (
                                    <div className="mx-4 mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                                        <AlertCircle size={14} className="flex-shrink-0" />
                                        <span className="flex-1">{threadError}</span>
                                        <button onClick={() => loadThread(activeConvId)} className="text-xs font-semibold underline hover:no-underline">
                                            Retry
                                        </button>
                                    </div>
                                )}

                                {/* Session state banner */}
                                <div className="pt-3">
                                    <StateBanner
                                        conversation={activeConv}
                                        onRestore={executeAction}
                                    />
                                </div>

                                {/* Messages */}
                                <div
                                    ref={threadRef}
                                    className="flex-1 overflow-y-auto px-4 py-2 relative"
                                >
                                    {loadingThread ? (
                                        <div className="flex items-center justify-center h-full">
                                            <RefreshCw size={22} className="animate-spin text-primary-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <EmptyState message="No messages yet. Send the first message below." />
                                    ) : (
                                        <>
                                            {messages.map((msg, idx) => (
                                                <MessageBubble
                                                    key={msg.id ?? `${msg.client_uid}-${idx}`}
                                                    message={msg}
                                                    grouped={shouldGroupWithPrev(messages, idx)}
                                                />
                                            ))}
                                        </>
                                    )}
                                </div>

                                {/* New messages below indicator */}
                                <div className="relative">
                                    <NewMessagesIndicator count={newMessagesBelow} onClick={() => scrollToBottom(true)} />
                                </div>

                                {/* Composer */}
                                {canManage && (
                                    <div className={`border-t border-gray-200 dark:border-gray-700 px-3 pt-3 pb-3 flex-shrink-0 ${isComposerDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
                                        {/* Note toggle */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <button
                                                onClick={() => setIsInternalNote(false)}
                                                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${!isInternalNote ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                Reply
                                            </button>
                                            <button
                                                onClick={() => setIsInternalNote(true)}
                                                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${isInternalNote ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                                            >
                                                Internal note
                                            </button>
                                        </div>

                                        <div className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors ${isInternalNote ? 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'}`}>
                                            <textarea
                                                ref={textareaRef}
                                                rows={1}
                                                value={draftBody}
                                                onChange={handleTextareaChange}
                                                onKeyDown={handleKeyDown}
                                                placeholder={isInternalNote ? 'Add internal note… (only visible to agents)' : 'Type a reply… (Enter to send, Shift+Enter for newline)'}
                                                className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none focus:border-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[36px] leading-relaxed"
                                                style={{ maxHeight: 112, boxShadow: 'none' }}
                                                disabled={sending}
                                            />
                                            <button
                                                onClick={handleSend}
                                                disabled={sending || !draftBody.trim()}
                                                className="flex-shrink-0 btn-primary !p-2 !px-2.5 !min-h-0 disabled:opacity-40"
                                                aria-label="Send message"
                                            >
                                                {sending ? <RefreshCw size={15} className="animate-spin" /> : <Send size={15} />}
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1.5 px-1">
                                            Enter to send · Shift+Enter for newline
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ── RIGHT PANEL: Session details ── */}
                    <div className={`w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-800 transition-all ${showRightPanel ? 'block' : 'hidden'}`}>
                        {activeConv ? (
                            <div className="p-5 space-y-5">
                                {/* Contact */}
                                <section>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Contact</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <Avatar name={activeConv.customer_name} size={44} />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{activeConv.customer_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{activeConv.customer_email}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Session */}
                                <section>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Session</h3>
                                    <dl className="space-y-2 text-xs">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                                            <dd className={`font-semibold ${STATUS_COLORS[activeConv.status]?.replace(/bg-\S+ /g, '').split(' ')[0]}`}>
                                                {STATUS_LABELS[activeConv.status]}
                                            </dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Muted</dt>
                                            <dd className="text-gray-700 dark:text-gray-300">{activeConv.is_muted ? 'Yes' : 'No'}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Messages</dt>
                                            <dd className="text-gray-700 dark:text-gray-300">{messages.length}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Assignee</dt>
                                            <dd className="text-gray-700 dark:text-gray-300 truncate max-w-[130px]">{activeConv.assignee?.name ?? 'Unassigned'}</dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Started</dt>
                                            <dd className="text-gray-700 dark:text-gray-300">{timestamp(activeConv.created_at)}</dd>
                                        </div>
                                    </dl>
                                </section>

                                {/* Merchant Context & Plan */}
                                {activeConv.merchant && (
                                    <>
                                        <section>
                                            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Merchant Context</h3>
                                            <div className="bg-white dark:bg-[#1A1F2C] border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm mb-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{activeConv.merchant.name}</span>
                                                    {activeConv.merchant.freemium && (
                                                        <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full uppercase font-bold">Free</span>
                                                    )}
                                                </div>
                                                <dl className="space-y-1.5 text-xs">
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-gray-500 dark:text-gray-400">Total Chats</dt>
                                                        <dd className="text-gray-700 dark:text-gray-300 font-semibold">{activeConv.merchant.total_chats}</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-gray-500 dark:text-gray-400">Country</dt>
                                                        <dd className="text-gray-700 dark:text-gray-300">{activeConv.merchant.country ?? 'Unknown'}</dd>
                                                    </div>
                                                    <div className="flex justify-between gap-2">
                                                        <dt className="text-gray-500 dark:text-gray-400">Credits</dt>
                                                        <dd className="text-primary-600 dark:text-primary-400 font-semibold">{activeConv.merchant.credits_balance?.toLocaleString() ?? 0}</dd>
                                                    </div>
                                                </dl>
                                            </div>

                                            {/* Plan Card */}
                                            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-sm relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/10 dark:bg-primary-500/5 rounded-bl-full -mr-4 -mt-4"></div>
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <div>
                                                        <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Active Plan</div>
                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">{activeConv.merchant.plan_name}</div>
                                                    </div>
                                                    {activeConv.merchant.plan_price > 0 && (
                                                        <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-md">
                                                            ${activeConv.merchant.plan_price}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-center text-xs mt-3 relative z-10">
                                                    <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-300">{activeConv.merchant.plan_remaining_days} days</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1.5 relative z-10">
                                                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(5, (activeConv.merchant.plan_remaining_days / 30) * 100))}%` }}></div>
                                                </div>
                                            </div>
                                        </section>

                                        {activeConv.merchant.recent_creations?.length > 0 && (
                                            <section>
                                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center justify-between">
                                                    Recent Creations
                                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full text-[9px]">{activeConv.merchant.recent_creations.length}</span>
                                                </h3>
                                                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                                    {activeConv.merchant.recent_creations.map(creation => (
                                                        <div key={creation.id} className="relative flex-shrink-0 w-16 h-16 group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                                            <img 
                                                                src={creation.url} 
                                                                alt={creation.tool} 
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                                <p className="text-[8px] text-white font-medium capitalize text-center px-1 leading-tight">{creation.tool.replace('_', ' ')}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </>
                                )}

                                {/* Sync */}
                                <section>
                                    <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Sync</h3>
                                    <dl className="space-y-2 text-xs">
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Mode</dt>
                                            <dd><SyncBadge mode={syncMode} /></dd>
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <dt className="text-gray-500 dark:text-gray-400">Last sync</dt>
                                            <dd className="text-gray-700 dark:text-gray-300 tabular-nums">{lastSyncedAt ? timestamp(lastSyncedAt) : '—'}</dd>
                                        </div>
                                        {syncMode === 'manual' && nextRefreshIn > 0 && (
                                            <div className="flex justify-between gap-2">
                                                <dt className="text-gray-500 dark:text-gray-400">Next refresh</dt>
                                                <dd className="text-gray-700 dark:text-gray-300 tabular-nums">{nextRefreshIn}s</dd>
                                            </div>
                                        )}
                                    </dl>
                                    {syncMode === 'manual' && (
                                        <button
                                            onClick={() => pollMessages()}
                                            className="mt-3 btn-secondary w-full flex items-center justify-center gap-1.5 !text-xs"
                                        >
                                            <RefreshCw size={12} />
                                            Refresh now
                                        </button>
                                    )}
                                </section>

                                {/* Danger zone */}
                                {canManage && activeConv.status === 'active' && (
                                    <section>
                                        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-red-400 dark:text-red-500 mb-3">Actions</h3>
                                        <div className="space-y-2">
                                            <button onClick={() => handleAction('end')} className="btn-sm-danger w-full flex items-center gap-2">
                                                <XCircle size={13} />
                                                End conversation
                                            </button>
                                            <button onClick={() => handleAction('spam')} className="btn-sm-warning w-full flex items-center gap-2">
                                                <Flag size={13} />
                                                Mark as spam
                                            </button>
                                            <button onClick={() => handleAction('block')} className="btn-sm-danger w-full flex items-center gap-2">
                                                <Ban size={13} />
                                                Block participant
                                            </button>
                                        </div>
                                    </section>
                                )}
                            </div>
                        ) : (
                            <EmptyState message="Select a conversation to see details." />
                        )}
                    </div>

                </div>
            </div>

            {/* Modals */}
            {confirmAction && (
                <ConfirmModal
                    action={confirmAction}
                    onConfirm={() => executeAction(confirmAction)}
                    onCancel={() => setConfirmAction(null)}
                />
            )}

            {showSyncSettings && (
                <SyncSettingsPanel
                    settings={syncSettings}
                    onSave={(newSettings) => {
                        setSyncSettings(newSettings);
                        setSyncMode(newSettings.realtime_enabled ? 'live' : 'manual');
                        setShowSyncSettings(false);
                    }}
                    onClose={() => setShowSyncSettings(false)}
                />
            )}
        </AdminLayout>
    );
}
