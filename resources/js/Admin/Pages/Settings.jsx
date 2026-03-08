import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAdminToast } from '@/Admin/Components/AdminToast';
import { Settings as SettingsIcon, Mail, Plus, Pencil, Trash2, Send, CheckCircle, Sliders, Inbox, Copy, Check, TrendingUp, AlertCircle, ShieldOff } from 'lucide-react';

const PURPOSE_LABELS = {
    support: 'Support',
    marketing: 'Marketing',
    general: 'General',
};

const TABS = [
    { key: 'general', label: 'General', icon: Sliders },
    { key: 'smtp', label: 'SMTP', icon: Mail },
];

const SMTP_CARD_COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];

function formatSentAt(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Settings() {
    const { smtpSettings = [], smtpPurposes = {}, smtpEncryptionOptions = {}, recentMailLogs = [], mailOverviewStats = null, canManageSmtp = false } = usePage().props;
    const toast = useAdminToast();
    const [activeTab, setActiveTab] = useState('general');
    const [copiedId, setCopiedId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [testId, setTestId] = useState(null);
    const [testEmail, setTestEmail] = useState('');

    const addForm = useForm({
        name: '',
        purpose: 'support',
        host: '',
        port: 587,
        encryption: 'tls',
        username: '',
        password: '',
        from_address: '',
        from_name: '',
        is_active: false,
    });

    const editForm = useForm({
        name: '',
        purpose: 'support',
        host: '',
        port: 587,
        encryption: 'tls',
        username: '',
        password: '',
        from_address: '',
        from_name: '',
        is_active: false,
    });

    const startEdit = (s) => {
        setEditingId(s.id);
        editForm.setData({
            name: s.name || '',
            purpose: s.purpose,
            host: s.host,
            port: s.port,
            encryption: s.encryption ?? '',
            username: s.username || '',
            password: '',
            from_address: s.from_address,
            from_name: s.from_name || '',
            is_active: s.is_active,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        editForm.reset();
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        addForm.post(route('admin.settings.smtp.store'), {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setShowAddForm(false);
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingId) return;
        editForm.put(route('admin.settings.smtp.update', editingId), {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
        });
    };

    const handleTest = (e) => {
        e.preventDefault();
        if (!testId || !testEmail.trim()) return;
        router.post(route('admin.settings.smtp.test'), { id: testId, test_email: testEmail.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                setTestId(null);
                setTestEmail('');
            },
        });
    };

    const copyError = (text, id = 'copy') => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Error copied');
            setCopiedId(id);
            window.setTimeout(() => setCopiedId(null), 2000);
        }).catch(() => {});
    };

    useEffect(() => {
        const onEscape = (e) => {
            if (e.key !== 'Escape') return;
            if (testId) { setTestId(null); setTestEmail(''); }
            if (editingId) cancelEdit();
        };
        if (testId || editingId) {
            document.addEventListener('keydown', onEscape);
            return () => document.removeEventListener('keydown', onEscape);
        }
    }, [testId, editingId]);

    return (
        <AdminLayout
            title="System Settings"
            breadcrumbs={[{ label: 'Settings' }]}
        >
            <div className="space-y-4">
                {/* Tabs: same pattern as AI Tools Analysis */}
                <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {TABS.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                activeTab === key
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>

                {activeTab === 'general' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <SettingsIcon size={18} className="text-gray-500 dark:text-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Global configuration
                            </h2>
                        </div>
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    System settings
                                </h2>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    System-wide settings. Use the tabs above to manage SMTP and other sections. More sections will appear here as they are added.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'smtp' && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Mail size={18} className="text-gray-500 dark:text-gray-400" />
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                SMTP configurations
                            </h2>
                        </div>

                        {!canManageSmtp && (
                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Mail settings
                                    </h2>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You do not have permission to view or manage SMTP settings. Contact an administrator if you need access.
                                    </p>
                                </div>
                            </div>
                        )}

                        {canManageSmtp && (
                            <div className="space-y-4">
                                {/* Mini stats: overall performance */}
                                {mailOverviewStats && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                        <div className="card flex items-center gap-3 p-3">
                                            <div className="rounded-lg p-2 bg-primary-50 dark:bg-primary-900/20">
                                                <Mail size={16} className="text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sent</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{mailOverviewStats.total_sent?.toLocaleString() ?? 0}</p>
                                            </div>
                                        </div>
                                        <div className="card flex items-center gap-3 p-3">
                                            <div className="rounded-lg p-2 bg-red-50 dark:bg-red-900/20">
                                                <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Error %</p>
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">{mailOverviewStats.error_percentage ?? 0}%</p>
                                            </div>
                                        </div>
                                        <div className="card flex items-center gap-3 p-3">
                                            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-900/20">
                                                <ShieldOff size={16} className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Blocked</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">{(mailOverviewStats.blocked ?? 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="card flex items-center gap-3 p-3 col-span-2 sm:col-span-1 lg:col-span-1 min-w-0">
                                            <div className="rounded-lg p-2 bg-gray-100 dark:bg-gray-700/50 flex-shrink-0">
                                                <AlertCircle size={16} className="text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Top error</p>
                                                {mailOverviewStats.top_error ? (
                                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate min-w-0" title={mailOverviewStats.top_error.message_full ?? mailOverviewStats.top_error.message}>
                                                            {mailOverviewStats.top_error.message} (×{mailOverviewStats.top_error.count})
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => copyError(mailOverviewStats.top_error?.message_full ?? mailOverviewStats.top_error?.message, 'top-error')}
                                                            className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-80"
                                                            title="Copy error"
                                                            aria-label={copiedId === 'top-error' ? 'Copied' : 'Copy top error message'}
                                                        >
                                                            {copiedId === 'top-error' ? <Check size={12} aria-hidden className="text-green-600 dark:text-green-400" /> : <Copy size={12} aria-hidden />}
                                                            {copiedId === 'top-error' ? 'Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-semibold text-gray-900 dark:text-white">—</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card flex items-center gap-3 p-3 col-span-2 sm:col-span-1 lg:col-span-1 min-w-0">
                                            <div className="rounded-lg p-2 bg-green-50 dark:bg-green-900/20 flex-shrink-0">
                                                <TrendingUp size={16} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Best SMTP</p>
                                                <p className="text-xs font-semibold text-green-700 dark:text-green-400 truncate" title={mailOverviewStats.best_smtp ? `${mailOverviewStats.best_smtp.label} ${mailOverviewStats.best_smtp.success_rate}%` : null}>
                                                    {mailOverviewStats.best_smtp ? `${mailOverviewStats.best_smtp.label} (${mailOverviewStats.best_smtp.success_rate}%)` : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col lg:flex-row gap-4">
                                {/* Left: cards + add form */}
                                <div className="flex-1 min-w-0 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Mail configs by purpose
                                        </h2>
                                        {!showAddForm && (
                                            <button
                                                type="button"
                                                onClick={() => setShowAddForm(true)}
                                                className="btn btn-primary inline-flex items-center gap-2 text-xs"
                                            >
                                                <Plus size={16} />
                                                Add SMTP
                                            </button>
                                        )}
                                    </div>

                                    {showAddForm && (
                            <div className="card overflow-hidden">
                                <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New SMTP configuration</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Label (optional)</label>
                                        <input
                                            type="text"
                                            value={addForm.data.name}
                                            onChange={(e) => addForm.setData('name', e.target.value)}
                                            className="form-input w-full"
                                            placeholder="e.g. Support Mailgun"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                                        <select
                                            value={addForm.data.purpose}
                                            onChange={(e) => addForm.setData('purpose', e.target.value)}
                                            className="form-input w-full"
                                        >
                                            {Object.entries(smtpPurposes).map(([value, label]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Host *</label>
                                        <input
                                            type="text"
                                            value={addForm.data.host}
                                            onChange={(e) => addForm.setData('host', e.target.value)}
                                            className="form-input w-full"
                                            placeholder="smtp.example.com"
                                            required
                                        />
                                        {addForm.errors.host && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{addForm.errors.host}</p>}
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={65535}
                                                value={addForm.data.port}
                                                onChange={(e) => addForm.setData('port', parseInt(e.target.value, 10) || 587)}
                                                className="form-input w-full"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                                            <select
                                                value={addForm.data.encryption ?? ''}
                                                onChange={(e) => addForm.setData('encryption', e.target.value || null)}
                                                className="form-input w-full"
                                            >
                                                {Object.entries(smtpEncryptionOptions).map(([value, label]) => (
                                                    <option key={value === null ? 'none' : value} value={value ?? ''}>{label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                        <input
                                            type="text"
                                            value={addForm.data.username}
                                            onChange={(e) => addForm.setData('username', e.target.value)}
                                            className="form-input w-full"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={addForm.data.password}
                                            onChange={(e) => addForm.setData('password', e.target.value)}
                                            className="form-input w-full"
                                            autoComplete="new-password"
                                            placeholder="Leave blank when editing to keep existing"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From address *</label>
                                        <input
                                            type="email"
                                            value={addForm.data.from_address}
                                            onChange={(e) => addForm.setData('from_address', e.target.value)}
                                            className="form-input w-full"
                                            required
                                        />
                                        {addForm.errors.from_address && <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{addForm.errors.from_address}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From name</label>
                                        <input
                                            type="text"
                                            value={addForm.data.from_name}
                                            onChange={(e) => addForm.setData('from_name', e.target.value)}
                                            className="form-input w-full"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={addForm.data.is_active}
                                            onChange={(e) => addForm.setData('is_active', e.target.checked)}
                                            className="rounded border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Set as active for this purpose</span>
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" disabled={addForm.processing} className="btn btn-primary">
                                        {addForm.processing ? 'Adding…' : 'Add configuration'}
                                    </button>
                                    <button type="button" onClick={() => { setShowAddForm(false); addForm.reset(); }} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                </div>
                                </form>
                            </div>
                                    )}

                                    {smtpSettings.length === 0 && !showAddForm && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No SMTP configurations yet. Click &quot;Add SMTP&quot; to add one.</p>
                                    )}
                                    {smtpSettings.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {smtpSettings.map((s, index) => (
                                        <div
                                            key={s.id}
                                            className="card overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                                        >
                                            <div
                                                className="h-1 flex-shrink-0"
                                                style={{ backgroundColor: SMTP_CARD_COLORS[index % SMTP_CARD_COLORS.length], opacity: 0.35 }}
                                            />
                                            <div className="p-4 flex-1 flex flex-col gap-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{s.name || PURPOSE_LABELS[s.purpose] || s.purpose}</h3>
                                                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">From: {s.from_address}</p>
                                                            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">{s.host}:{s.port}</p>
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{PURPOSE_LABELS[s.purpose] || s.purpose}</span>
                                                                {s.is_active ? (
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                                                                        <CheckCircle size={12} /> Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600/50 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700/80 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Total sent</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white tabular-nums">{(s.total_sent ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Success</p>
                                                            <p className="font-semibold text-green-600 dark:text-green-400 tabular-nums">{(s.success_count ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Failed</p>
                                                            <p className="font-semibold text-red-600 dark:text-red-400 tabular-nums">{(s.failed_count ?? 0).toLocaleString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 dark:text-gray-400">Avg time</p>
                                                            <p className="font-semibold text-gray-900 dark:text-white tabular-nums">
                                                                {s.avg_sent_time_ms != null ? `${(s.avg_sent_time_ms / 1000).toFixed(2)}s` : '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center justify-end gap-1 mt-auto pt-2">
                                                    <button type="button" onClick={() => startEdit(s)} className="btn btn-secondary btn-sm inline-flex items-center gap-1" title="Edit">
                                                        <Pencil size={14} />
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => { setTestId(s.id); setTestEmail(''); }} className="btn btn-secondary btn-sm inline-flex items-center gap-1" title="Send test email">
                                                        <Send size={14} />
                                                        Test
                                                    </button>
                                                    {!s.is_active && (
                                                        <button
                                                            type="button"
                                                            onClick={() => router.post(route('admin.settings.smtp.set-active', s.id), {}, { preserveScroll: true })}
                                                            className="btn btn-secondary btn-sm"
                                                        >
                                                            Set active
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => { if (confirm('Remove this SMTP configuration?')) router.delete(route('admin.settings.smtp.destroy', s.id), { preserveScroll: true }); }}
                                                        className="btn btn-secondary btn-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 inline-flex items-center gap-1"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                    </div>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                    )}
                                </div>

                                {/* Right: recent sent mails */}
                                <div className="w-full lg:w-80 flex-shrink-0">
                                    <div className="card overflow-hidden lg:sticky lg:top-4">
                                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                            <Inbox size={16} className="text-gray-500 dark:text-gray-400" />
                                            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent sent mails</h2>
                                        </div>
                                        <div className="p-2 max-h-[420px] overflow-y-auto">
                                            {recentMailLogs.length === 0 ? (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 p-2">No mail sent yet.</p>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {recentMailLogs.map((log) => (
                                                        <li key={log.id} className="rounded-lg border border-gray-100 dark:border-gray-700 p-2 text-xs">
                                                            <div className="flex items-center justify-between gap-1 flex-wrap">
                                                                <span className="font-medium text-gray-900 dark:text-white truncate" title={log.to_address}>{log.to_address}</span>
                                                                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${log.status === 'sent' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                                                                    {log.status === 'sent' ? 'Sent' : 'Failed'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                <span>{formatSentAt(log.sent_at)}</span>
                                                                {log.duration_ms != null && <span className="tabular-nums">{log.duration_ms}ms</span>}
                                                            </div>
                                                            {log.error_message && (
                                                                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                                    <p className="flex-1 min-w-0 text-red-600 dark:text-red-400 truncate text-xs" title={log.error_message}>{log.error_message}</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyError(log.error_message, `log-${log.id}`)}
                                                                        className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-80"
                                                                        title="Copy error"
                                                                        aria-label={copiedId === `log-${log.id}` ? 'Copied' : 'Copy error message'}
                                                                    >
                                                                        {copiedId === `log-${log.id}` ? <Check size={12} aria-hidden className="text-green-600 dark:text-green-400" /> : <Copy size={12} aria-hidden />}
                                                                        {copiedId === `log-${log.id}` ? 'Copied' : 'Copy'}
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {log.smtp_label && <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500 truncate">{log.smtp_label}</p>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {testId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="test-smtp-title"
                    onClick={(e) => e.target === e.currentTarget && (setTestId(null), setTestEmail(''))}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 id="test-smtp-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send test email</h3>
                        <form onSubmit={handleTest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                                <input
                                    type="email"
                                    value={testEmail}
                                    onChange={(e) => setTestEmail(e.target.value)}
                                    className="form-input w-full"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="submit" className="btn btn-primary">Send test</button>
                                <button type="button" onClick={() => { setTestId(null); setTestEmail(''); }} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="edit-smtp-title"
                    onClick={(e) => e.target === e.currentTarget && cancelEdit()}
                >
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 id="edit-smtp-title" className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit SMTP configuration</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Label (optional)</label>
                                    <input type="text" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="form-input w-full" placeholder="e.g. Support Mailgun" />
                                </div>
                                <div>
                                    <label className="form-label">Purpose</label>
                                    <select value={editForm.data.purpose} onChange={(e) => editForm.setData('purpose', e.target.value)} className="form-input w-full">
                                        {Object.entries(smtpPurposes).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">Host *</label>
                                    <input type="text" value={editForm.data.host} onChange={(e) => editForm.setData('host', e.target.value)} className="form-input w-full" placeholder="smtp.example.com" required />
                                    {editForm.errors.host && <p className="form-error">{editForm.errors.host}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Port</label>
                                    <input type="number" min={1} max={65535} value={editForm.data.port} onChange={(e) => editForm.setData('port', parseInt(e.target.value, 10) || 587)} className="form-input w-full" />
                                </div>
                                <div>
                                    <label className="form-label">Encryption</label>
                                    <select value={editForm.data.encryption ?? ''} onChange={(e) => editForm.setData('encryption', e.target.value || null)} className="form-input w-full">
                                        {Object.entries(smtpEncryptionOptions).map(([value, label]) => (
                                            <option key={value === null ? 'none' : value} value={value ?? ''}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">Username</label>
                                    <input type="text" value={editForm.data.username} onChange={(e) => editForm.setData('username', e.target.value)} className="form-input w-full" autoComplete="off" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">Password</label>
                                    <input type="password" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} className="form-input w-full" placeholder="Leave blank to keep existing" autoComplete="new-password" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">From address *</label>
                                    <input type="email" value={editForm.data.from_address} onChange={(e) => editForm.setData('from_address', e.target.value)} className="form-input w-full" required />
                                    {editForm.errors.from_address && <p className="form-error">{editForm.errors.from_address}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="form-label">From name</label>
                                    <input type="text" value={editForm.data.from_name} onChange={(e) => editForm.setData('from_name', e.target.value)} className="form-input w-full" />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Set as active for this purpose</span>
                                </label>
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                <button type="submit" disabled={editForm.processing} className="btn btn-primary">
                                    {editForm.processing ? 'Saving…' : 'Save'}
                                </button>
                                <button type="button" onClick={cancelEdit} className="btn btn-secondary">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
