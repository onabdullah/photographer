import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Settings as SettingsIcon, Mail, Plus, Pencil, Trash2, Send, CheckCircle, Sliders } from 'lucide-react';

const PURPOSE_LABELS = {
    support: 'Support',
    marketing: 'Marketing',
    general: 'General',
};

const TABS = [
    { key: 'general', label: 'General', icon: Sliders },
    { key: 'smtp', label: 'SMTP', icon: Mail },
];

export default function Settings() {
    const { smtpSettings = [], smtpPurposes = {}, smtpEncryptionOptions = {}, canManageSmtp = false } = usePage().props;
    const [activeTab, setActiveTab] = useState('general');
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
                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
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
                            <form onSubmit={handleAddSubmit} className="mx-4 mb-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-4">
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
                        )}

                                <div className="p-4 pt-0 space-y-3">
                                    {smtpSettings.length === 0 && !showAddForm && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No SMTP configurations yet. Click “Add SMTP” to add one.</p>
                                    )}
                                    {smtpSettings.map((s) => (
                                        <div
                                            key={s.id}
                                            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800/50"
                                        >
                                            {editingId === s.id ? (
                                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit SMTP</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
                                                    <input type="text" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className="form-input w-full" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                                                    <select value={editForm.data.purpose} onChange={(e) => editForm.setData('purpose', e.target.value)} className="form-input w-full">
                                                        {Object.entries(smtpPurposes).map(([value, label]) => (
                                                            <option key={value} value={value}>{label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Host *</label>
                                                    <input type="text" value={editForm.data.host} onChange={(e) => editForm.setData('host', e.target.value)} className="form-input w-full" required />
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                                                        <input type="number" min={1} max={65535} value={editForm.data.port} onChange={(e) => editForm.setData('port', parseInt(e.target.value, 10) || 587)} className="form-input w-full" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                                                        <select value={editForm.data.encryption ?? ''} onChange={(e) => editForm.setData('encryption', e.target.value || null)} className="form-input w-full">
                                                            {Object.entries(smtpEncryptionOptions).map(([value, label]) => (
                                                                <option key={value === null ? 'none' : value} value={value ?? ''}>{label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                                                    <input type="text" value={editForm.data.username} onChange={(e) => editForm.setData('username', e.target.value)} className="form-input w-full" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                                    <input type="password" value={editForm.data.password} onChange={(e) => editForm.setData('password', e.target.value)} className="form-input w-full" placeholder="Leave blank to keep existing" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From address *</label>
                                                    <input type="email" value={editForm.data.from_address} onChange={(e) => editForm.setData('from_address', e.target.value)} className="form-input w-full" required />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From name</label>
                                                    <input type="text" value={editForm.data.from_name} onChange={(e) => editForm.setData('from_name', e.target.value)} className="form-input w-full" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" checked={editForm.data.is_active} onChange={(e) => editForm.setData('is_active', e.target.checked)} className="rounded border-gray-300 dark:border-gray-600" />
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">Active for this purpose</span>
                                                </label>
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="submit" disabled={editForm.processing} className="btn btn-primary">Save</button>
                                                <button type="button" onClick={cancelEdit} className="btn btn-secondary">Cancel</button>
                                                </div>
                                                </form>
                                            ) : (
                                                <>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-gray-900 dark:text-white">{s.name || PURPOSE_LABELS[s.purpose] || s.purpose}</span>
                                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{PURPOSE_LABELS[s.purpose] || s.purpose}</span>
                                                    {s.is_active && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center gap-1">
                                                            <CheckCircle size={12} /> Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
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
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                {s.host}:{s.port} · From: {s.from_address}
                                            </p>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {testId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="test-smtp-title">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
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
        </AdminLayout>
    );
}
