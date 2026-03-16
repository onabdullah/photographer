import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage, router, useForm, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { useAdminToast } from '@/Admin/Components/AdminToast';
import { Settings as SettingsIcon, Mail, Plus, Pencil, Trash2, Send, CheckCircle, Sliders, Inbox, Copy, Check, TrendingUp, AlertCircle, ShieldOff, Image as ImageIcon, Shield, KeyRound, Lock, FileText, X, LogOut, Globe, Monitor, LogIn, Palette, Upload, Sparkles } from 'lucide-react';

const PURPOSE_LABELS = {
    support: 'Support',
    marketing: 'Marketing',
    general: 'General',
};

const TABS = [
    { key: 'general', label: 'General', icon: Sliders },
    { key: 'security', label: 'System Security', icon: Lock },
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

const SOCIAL_KEYS = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];

function DashboardContentTab({ heroSettings, featuredToolsSettings, announcementSettings, availableTools, canManageSettings }) {
    const toast = useAdminToast();
    const form = useForm({
        heroTitle: heroSettings?.title || '',
        heroSubtitle: heroSettings?.subtitle || '',
        heroImageUrl: heroSettings?.imageUrl || '',
        heroImageFile: null,
        featuredToolsEnabled: featuredToolsSettings?.enabled || false,
        featuredTools: featuredToolsSettings?.tools || [],
        announcementEnabled: announcementSettings?.enabled || false,
        announcementText: announcementSettings?.text || '',
    });

    const [imagePreview, setImagePreview] = useState(heroSettings?.imageUrl);

    const toggleTool = (toolKey) => {
        const tools = form.data.featuredTools || [];
        if (tools.includes(toolKey)) {
            form.setData('featuredTools', tools.filter((t) => t !== toolKey));
        } else {
            form.setData('featuredTools', [...tools, toolKey]);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setData('heroImageFile', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('heroTitle', form.data.heroTitle);
        formData.append('heroSubtitle', form.data.heroSubtitle);
        formData.append('heroImageUrl', form.data.heroImageUrl || '');
        if (form.data.heroImageFile) {
            formData.append('heroImageFile', form.data.heroImageFile);
        }
        formData.append('featuredToolsEnabled', form.data.featuredToolsEnabled ? 1 : 0);
        // Append each featured tool separately for array validation
        (form.data.featuredTools || []).forEach(tool => {
            formData.append('featuredTools[]', tool);
        });
        formData.append('announcementEnabled', form.data.announcementEnabled ? 1 : 0);
        formData.append('announcementText', form.data.announcementText || '');

        router.put(route('dashboard-settings.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Dashboard content updated successfully');
                form.setData('heroImageFile', null);
            },
            onError: (errors) => {
                console.error('Dashboard update errors:', errors);
                toast.error('Failed to update dashboard content');
            },
        });
    };

    return (
        <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Hero Section */}
                <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Hero Section</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                            <input
                                type="text"
                                value={form.data.heroTitle}
                                onChange={(e) => form.setData('heroTitle', e.target.value)}
                                placeholder="e.g., Let's grow your business together"
                                maxLength={255}
                                className="form-input w-full text-sm"
                            />
                            {form.errors.heroTitle && <p className="text-red-500 text-xs mt-1">{form.errors.heroTitle}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtitle</label>
                            <textarea
                                value={form.data.heroSubtitle}
                                onChange={(e) => form.setData('heroSubtitle', e.target.value)}
                                placeholder="Describe your offer..."
                                maxLength={500}
                                rows={2}
                                className="form-input w-full text-sm"
                            />
                            {form.errors.heroSubtitle && <p className="text-red-500 text-xs mt-1">{form.errors.heroSubtitle}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hero Image</label>
                            {imagePreview && (
                                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 mb-3 bg-gray-100 dark:bg-gray-700 h-24 w-full">
                                    <img src={imagePreview} alt="Hero" className="w-full h-full object-cover" onError={() => setImagePreview(null)} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Or upload from file</label>
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-colors">
                                        <Upload size={16} className="text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Choose image</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="sr-only"
                                            onChange={handleImageUpload}
                                            disabled={form.processing}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Or enter image URL</label>
                                    <input
                                        type="url"
                                        value={form.data.heroImageUrl}
                                        onChange={(e) => {
                                            form.setData('heroImageUrl', e.target.value);
                                            if (!form.data.heroImageFile) setImagePreview(e.target.value);
                                        }}
                                        placeholder="https://images.unsplash.com/..."
                                        className="form-input w-full text-sm"
                                    />
                                </div>
                            </div>
                            {form.errors.heroImageUrl && <p className="text-red-500 text-xs mt-1">{form.errors.heroImageUrl}</p>}
                            {form.errors.heroImageFile && <p className="text-red-500 text-xs mt-1">{form.errors.heroImageFile}</p>}
                        </div>
                    </div>
                </div>

                {/* Featured Tools */}
                <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Featured Tools</h3>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="featured-tools-enabled"
                                checked={form.data.featuredToolsEnabled}
                                onChange={(e) => form.setData('featuredToolsEnabled', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                            <label htmlFor="featured-tools-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                                Show featured tools section
                            </label>
                        </div>

                        {form.data.featuredToolsEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 ml-6">
                                {availableTools.map((tool) => (
                                    <label key={tool.key} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.data.featuredTools?.includes(tool.key) || false}
                                            onChange={() => toggleTool(tool.key)}
                                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{tool.label}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Announcements */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Announcement Banner</h3>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="announcement-enabled"
                            checked={form.data.announcementEnabled}
                            onChange={(e) => form.setData('announcementEnabled', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <label htmlFor="announcement-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Show announcement
                        </label>
                    </div>

                    {form.data.announcementEnabled && (
                        <div className="ml-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                            <textarea
                                value={form.data.announcementText}
                                onChange={(e) => form.setData('announcementText', e.target.value)}
                                placeholder="e.g., New feature available for all users!"
                                maxLength={1000}
                                rows={2}
                                className="form-input w-full text-sm"
                            />
                            {form.errors.announcementText && <p className="text-red-500 text-xs mt-1">{form.errors.announcementText}</p>}
                        </div>
                    )}
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button type="submit" disabled={form.processing} className="btn btn-primary btn-sm">
                        {form.processing ? 'Saving...' : 'Save dashboard content'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function LoginLogDetailModal({ log, onClose }) {
    if (!log) return null;

    const isLogout  = log.event_type === 'logout';
    const isFailed  = log.status === 'failed';
    const eventLabel = isLogout ? 'Logout' : isFailed ? 'Login Failed' : 'Login Success';
    const eventBadgeCls = isLogout
        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
        : isFailed
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    const EventIcon = isLogout ? LogOut : isFailed ? AlertCircle : CheckCircle;

    const location = [log.city, log.country].filter(Boolean).join(', ') || log.location || '—';
    const riskPct  = log.risk_percentage ?? 0;
    const riskLabel = riskPct >= 70 ? 'High' : riskPct >= 40 ? 'Medium' : 'Low';
    const riskBarCls = riskPct >= 70 ? 'bg-red-500' : riskPct >= 40 ? 'bg-amber-500' : 'bg-green-500';
    const riskTextCls = riskPct >= 70
        ? 'text-red-600 dark:text-red-400'
        : riskPct >= 40
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-green-600 dark:text-green-400';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${eventBadgeCls}`}>
                            <EventIcon size={12} />
                            {eventLabel}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString(undefined, {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                            })}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto">
                    <div className="p-6 space-y-5">

                        {/* Identity */}
                        <section>
                            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Identity</h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Email</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white break-all">{log.email || '—'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">User ID</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.user_id ? `#${log.user_id}` : 'Unknown'}</p>
                                </div>
                            </div>
                        </section>

                        {/* Network */}
                        <section>
                            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Network</h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">IP Address</p>
                                    <p className="text-sm font-mono text-gray-900 dark:text-white">{log.ip_address || '—'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Location</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{location}</p>
                                </div>
                            </div>
                        </section>

                        {/* Device & Browser */}
                        <section>
                            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Device &amp; Browser</h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Browser</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{log.browser || '—'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Operating System</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{log.os || '—'}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Device Type</p>
                                    <p className="text-sm text-gray-900 dark:text-white">{log.device_type || '—'}</p>
                                </div>
                            </div>
                        </section>

                        {/* Risk */}
                        {!isLogout && (
                            <section>
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Risk Assessment</h3>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{riskLabel} Risk</span>
                                        <span className={`text-sm font-bold tabular-nums ${riskTextCls}`}>{riskPct}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${riskBarCls}`}
                                            style={{ width: `${riskPct}%` }}
                                        />
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Raw User Agent */}
                        {log.user_agent && (
                            <section>
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Raw User Agent</h3>
                                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 break-all leading-relaxed">
                                    {log.user_agent}
                                </p>
                            </section>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Settings() {
    const { smtpSettings = [], smtpPurposes = {}, smtpEncryptionOptions = {}, recentMailLogs = [], mailOverviewStats = null, canManageSmtp = false, canManageSettings = false, general = {}, security = {}, loginLogs = { data: [] }, loginLogStats = {}, logFilters = {}, two_factor_qr_url = null, two_factor_secret = null, heroSettings = {}, featuredToolsSettings = {}, announcementSettings = {}, availableTools = [] } = usePage().props;
    const toast = useAdminToast();
    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        return params.get('tab') || 'general';
    });
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const pageUrl = usePage().url;
    useEffect(() => {
        const u = new URL(pageUrl, window.location.origin);
        const t = u.searchParams.get('tab');
        if (t && ['general', 'security', 'smtp'].includes(t)) setActiveTab(t);
    }, [pageUrl]);
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

    const generalForm = useForm({
        app_name: general.app_name ?? '',
        logo: null,
        footer_text: general.footer_text ?? '',
        social_links: general.social_links || {},
    });

    const securityForm = useForm({
        password_expiry_days: String(security.password_expiry_days ?? 0),
    });

    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
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

    const handleGeneralSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('app_name', generalForm.data.app_name || '');
        formData.append('footer_text', generalForm.data.footer_text || '');
        formData.append('social_links_json', JSON.stringify(generalForm.data.social_links || {}));
        if (generalForm.data.logo) {
            formData.append('logo', generalForm.data.logo);
        }

        router.post(route('admin.settings.general.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Branding updated successfully');
                generalForm.setData('logo', null);
            },
            onError: (errors) => {
                console.error('Branding update errors:', errors);
                toast.error('Failed to update branding');
            },
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put(route('admin.settings.password.update'), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
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
                    <div className="space-y-6">
                        {/* Branding */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                <ImageIcon size={18} className="text-primary-600 dark:text-primary-400" />
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Branding
                                </h2>
                            </div>
                            <div className="p-4">
                                {canManageSettings ? (
                                    <form onSubmit={handleGeneralSubmit} className="space-y-4">
                                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                                                    {general.app_logo_url ? (
                                                        <img src={general.app_logo_url} alt="App logo" className="w-full h-full object-contain" />
                                                    ) : generalForm.data.logo ? (
                                                        <img src={URL.createObjectURL(generalForm.data.logo)} alt="Preview" className="w-full h-full object-contain" />
                                                    ) : (
                                                        <ImageIcon size={32} className="text-gray-400 dark:text-gray-500" />
                                                    )}
                                                </div>
                                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-primary-600 dark:hover:text-primary-400">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                                                        className="sr-only"
                                                        onChange={(e) => generalForm.setData('logo', e.target.files?.[0] ?? null)}
                                                    />
                                                    Change logo
                                                </label>
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-4">
                                                <div>
                                                    <label htmlFor="app_name" className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        App name
                                                    </label>
                                                    <input
                                                        id="app_name"
                                                        type="text"
                                                        value={generalForm.data.app_name}
                                                        onChange={(e) => generalForm.setData('app_name', e.target.value)}
                                                        className="form-input w-full"
                                                        placeholder="e.g. My Admin"
                                                    />
                                                    {(generalForm.errors.app_name || generalForm.errors.logo) && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                            {generalForm.errors.app_name || generalForm.errors.logo}
                                                        </p>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Logo and name are used across the app (admin, login, footer). Recommended: square image, max 2 MB.
                                                </p>
                                                <div>
                                                    <label htmlFor="footer_text" className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 mt-4">Footer text</label>
                                                    <input id="footer_text" type="text" value={generalForm.data.footer_text} onChange={(e) => generalForm.setData('footer_text', e.target.value)} className="form-input w-full" placeholder="e.g. © 2026 Your Company" />
                                                </div>
                                                <div className="pt-2">
                                                    <span className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Social links</span>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {SOCIAL_KEYS.map((key) => (
                                                            <input key={key} type="url" placeholder={key.charAt(0).toUpperCase() + key.slice(1)} value={generalForm.data.social_links[key] || ''} onChange={(e) => generalForm.setData('social_links', { ...generalForm.data.social_links, [key]: e.target.value })} className="form-input w-full text-sm" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={generalForm.processing}
                                                    className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                                                >
                                                    {generalForm.processing ? 'Saving…' : 'Save branding'}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
                                            {general.app_logo_url ? (
                                                <img src={general.app_logo_url} alt="App logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <ImageIcon size={24} className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{general.app_name || '—'}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">You don’t have permission to edit branding.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Dashboard Content */}
                        <div className="card overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                                <Palette size={18} className="text-primary-600 dark:text-primary-400" />
                                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Dashboard Content</h2>
                            </div>
                            <div className="p-4">
                                {canManageSettings ? (
                                    <DashboardContentTab
                                        heroSettings={heroSettings}
                                        featuredToolsSettings={featuredToolsSettings}
                                        announcementSettings={announcementSettings}
                                        availableTools={availableTools}
                                        canManageSettings={canManageSettings}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        You do not have permission to manage dashboard content. Contact an administrator if you need access.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left: policy, password, 2FA */}
                        <div className="w-full lg:w-1/2 lg:min-w-0 space-y-6">
                            {canManageSettings && (
                                <div className="card overflow-hidden">
                                    <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                        <Lock size={18} className="text-primary-600 dark:text-primary-400" />
                                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Password policy</h2>
                                    </div>
                                    <div className="p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Require password change after this many days (0 = no expiry).</p>
                                        <form onSubmit={(e) => { e.preventDefault(); securityForm.put(route('admin.settings.security.update'), { preserveScroll: true }); }} className="flex flex-wrap items-end gap-3">
                                            <div className="min-w-[120px]">
                                                <label htmlFor="password_expiry_days" className="form-label block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Days</label>
                                                <input id="password_expiry_days" type="number" min={0} max={365} value={securityForm.data.password_expiry_days} onChange={(e) => securityForm.setData('password_expiry_days', e.target.value)} className="form-input w-full" />
                                            </div>
                                            <button type="submit" disabled={securityForm.processing} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">Save</button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
                                    <KeyRound size={18} className="text-primary-600 dark:text-primary-400" />
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Password</h2>
                                    {security.is_default_password && <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">Default password — change recommended</span>}
                                    {security.password_change_required && !security.is_default_password && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200">Change required</span>}
                                    {security.password_updated_at && !security.password_change_required && <span className="text-xs text-gray-500 dark:text-gray-400">Last changed: {new Date(security.password_updated_at).toLocaleDateString()}</span>}
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Change your account password. Use a strong, unique password.</p>
                                    <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                                        <div><label htmlFor="current_password" className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current password</label><input id="current_password" type="password" value={passwordForm.data.current_password} onChange={(e) => passwordForm.setData('current_password', e.target.value)} className="form-input w-full" autoComplete="current-password" />{passwordForm.errors.current_password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.current_password}</p>}</div>
                                        <div><label htmlFor="new_password" className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New password</label><input id="new_password" type="password" value={passwordForm.data.password} onChange={(e) => passwordForm.setData('password', e.target.value)} className="form-input w-full" autoComplete="new-password" />{passwordForm.errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.password}</p>}</div>
                                        <div><label htmlFor="password_confirmation" className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm new password</label><input id="password_confirmation" type="password" value={passwordForm.data.password_confirmation} onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)} className="form-input w-full" autoComplete="new-password" />{passwordForm.errors.password_confirmation && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passwordForm.errors.password_confirmation}</p>}</div>
                                        <button type="submit" disabled={passwordForm.processing} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">{passwordForm.processing ? 'Updating…' : 'Update password'}</button>
                                    </form>
                                </div>
                            </div>

                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                                    <Shield size={18} className="text-primary-600 dark:text-primary-400" />
                                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Two-factor authentication</h2>
                                    {security.two_fa_enabled && <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">Enabled</span>}
                                </div>
                                <div className="p-4 space-y-4">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security by requiring a code from your authenticator app when signing in.</p>
                                    {security.two_fa_enabled ? (
                                        <form onSubmit={(e) => { e.preventDefault(); router.post(route('admin.settings.two-factor.disable'), { current_password: twoFactorDisablePassword }, { preserveScroll: true, onSuccess: () => setTwoFactorDisablePassword('') }); }} className="space-y-3 max-w-md">
                                            <label className="form-label block text-sm font-medium text-gray-700 dark:text-gray-300">Disable 2FA (enter current password)</label>
                                            <input type="password" value={twoFactorDisablePassword} onChange={(e) => setTwoFactorDisablePassword(e.target.value)} className="form-input w-full" placeholder="Current password" autoComplete="current-password" />
                                            <button type="submit" disabled={!twoFactorDisablePassword.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">Disable 2FA</button>
                                        </form>
                                    ) : two_factor_qr_url ? (
                                        <div className="space-y-3">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">Scan the QR code with your authenticator app, then enter the 6-digit code below.</p>
                                            <div className="flex flex-wrap gap-4 items-start">
                                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(two_factor_qr_url)}`} alt="QR code" className="w-[180px] h-[180px] border border-gray-200 dark:border-gray-600 rounded-lg" />
                                                <div className="flex-1 min-w-[200px]">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Or enter this secret manually: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{two_factor_secret || '—'}</code></p>
                                                    <form onSubmit={(e) => { e.preventDefault(); router.post(route('admin.settings.two-factor.confirm'), { code: twoFactorCode }, { preserveScroll: true, onSuccess: () => setTwoFactorCode('') }); }} className="space-y-2">
                                                        <input type="text" inputMode="numeric" maxLength={6} value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="form-input w-full text-center text-lg tracking-widest font-mono" placeholder="000000" />
                                                        <button type="submit" disabled={twoFactorCode.length !== 6} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50">Confirm and enable 2FA</button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={(e) => { e.preventDefault(); router.post(route('admin.settings.two-factor.setup'), {}, { preserveScroll: true }); }}>
                                            <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">Enable two-factor authentication</button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: login log stats + logs */}
                        <div className="w-full lg:w-1/2 lg:min-w-0 space-y-4">
                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="card flex items-center gap-2 p-3">
                                    <div className="rounded-lg p-1.5 bg-primary-50 dark:bg-primary-900/20">
                                        <FileText size={14} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total events</p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white tabular-nums">{loginLogStats.total?.toLocaleString() ?? 0}</p>
                                    </div>
                                </div>
                                <div className="card flex items-center gap-2 p-3">
                                    <div className="rounded-lg p-1.5 bg-green-50 dark:bg-green-900/20">
                                        <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Successful logins</p>
                                        <p className="text-base font-bold text-green-700 dark:text-green-400 tabular-nums">{loginLogStats.success?.toLocaleString() ?? 0}</p>
                                    </div>
                                </div>
                                <div className="card flex items-center gap-2 p-3">
                                    <div className="rounded-lg p-1.5 bg-red-50 dark:bg-red-900/20">
                                        <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Failed attempts</p>
                                        <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">{loginLogStats.failed?.toLocaleString() ?? 0}</p>
                                    </div>
                                </div>
                                <div className="card flex items-center gap-2 p-3">
                                    <div className="rounded-lg p-1.5 bg-blue-50 dark:bg-blue-900/20">
                                        <LogOut size={14} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Logouts</p>
                                        <p className="text-base font-bold text-blue-700 dark:text-blue-400 tabular-nums">{loginLogStats.logout?.toLocaleString() ?? 0}</p>
                                    </div>
                                </div>
                                <div className="card col-span-2 flex items-center gap-2 p-3">
                                    <div className="rounded-lg p-1.5 bg-amber-50 dark:bg-amber-900/20">
                                        <Shield size={14} className="text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">High risk events</p>
                                        <p className="text-base font-bold text-amber-700 dark:text-amber-400 tabular-nums">{loginLogStats.high_risk?.toLocaleString() ?? 0}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Log table */}
                            <div className="card overflow-hidden">
                                <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-gray-500 dark:text-gray-400" />
                                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Access logs</h2>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">Click any row for details</span>
                                </div>

                                {/* Filters */}
                                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            const fd = new FormData(e.target);
                                            router.get(route('admin.settings'), {
                                                tab: 'security',
                                                log_event_type: fd.get('log_event_type') || undefined,
                                                log_status: fd.get('log_status') || undefined,
                                                log_email: fd.get('log_email') || undefined,
                                                log_ip: fd.get('log_ip') || undefined,
                                                log_date_from: fd.get('log_date_from') || undefined,
                                                log_date_to: fd.get('log_date_to') || undefined,
                                            }, { preserveState: true });
                                        }}
                                        className="flex flex-wrap items-center gap-2"
                                    >
                                        <select name="log_event_type" className="form-input text-xs w-24" defaultValue={logFilters.log_event_type ?? ''}>
                                            <option value="">All events</option>
                                            <option value="login">Login</option>
                                            <option value="logout">Logout</option>
                                        </select>
                                        <select name="log_status" className="form-input text-xs w-24" defaultValue={logFilters.log_status ?? ''}>
                                            <option value="">Any status</option>
                                            <option value="success">Success</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                        <input type="text" name="log_email" placeholder="Email" className="form-input text-xs w-28 min-w-0" defaultValue={logFilters.log_email ?? ''} />
                                        <input type="text" name="log_ip" placeholder="IP" className="form-input text-xs w-24 min-w-0" defaultValue={logFilters.log_ip ?? ''} />
                                        <input type="date" name="log_date_from" className="form-input text-xs w-28" defaultValue={logFilters.log_date_from ?? ''} />
                                        <input type="date" name="log_date_to" className="form-input text-xs w-28" defaultValue={logFilters.log_date_to ?? ''} />
                                        <button type="submit" className="px-2 py-1 rounded bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 whitespace-nowrap">Filter</button>
                                    </form>
                                </div>

                                {/* Table */}
                                <div className="max-h-[380px] overflow-y-auto">
                                    <table className="w-full text-xs">
                                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/95 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Event</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Time</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Email</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">IP / Location</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Browser / OS</th>
                                                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Risk</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(loginLogs.data || []).length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-6 px-2 text-center text-gray-400 dark:text-gray-500">No access logs yet.</td>
                                                </tr>
                                            ) : (
                                                (loginLogs.data || []).map((log) => {
                                                    const isLogout = log.event_type === 'logout';
                                                    const isFailed = log.status === 'failed';
                                                    const badgeCls = isLogout
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                                        : isFailed
                                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                                                    const EvtIcon = isLogout ? LogOut : isFailed ? AlertCircle : LogIn;
                                                    const location = [log.city, log.country].filter(Boolean).join(', ') || log.location || '—';
                                                    return (
                                                        <tr
                                                            key={log.id}
                                                            className="border-b border-gray-100 dark:border-gray-700/60 hover:bg-primary-50/60 dark:hover:bg-primary-900/10 cursor-pointer transition-colors"
                                                            onClick={() => setSelectedLog(log)}
                                                            title="Click for details"
                                                        >
                                                            <td className="py-2 px-2">
                                                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${badgeCls}`}>
                                                                    <EvtIcon size={10} />
                                                                    <span>{isLogout ? 'Logout' : isFailed ? 'Failed' : 'Login'}</span>
                                                                </span>
                                                            </td>
                                                            <td className="py-2 px-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                                {new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </td>
                                                            <td className="py-2 px-2 font-medium text-gray-900 dark:text-white max-w-[120px] truncate" title={log.email}>
                                                                {log.email}
                                                            </td>
                                                            <td className="py-2 px-2 max-w-[110px]">
                                                                <p className="font-mono text-gray-700 dark:text-gray-300 truncate">{log.ip_address || '—'}</p>
                                                                <p className="text-gray-400 dark:text-gray-500 truncate" title={location}>{location}</p>
                                                            </td>
                                                            <td className="py-2 px-2 max-w-[120px]">
                                                                <p className="text-gray-700 dark:text-gray-300 truncate" title={log.browser}>{log.browser || '—'}</p>
                                                                <p className="text-gray-400 dark:text-gray-500 truncate" title={log.os}>{log.os || '—'}</p>
                                                            </td>
                                                            <td className="py-2 px-2">
                                                                {isLogout ? (
                                                                    <span className="text-gray-400 dark:text-gray-500">—</span>
                                                                ) : (
                                                                    <span className={`font-medium ${log.risk_percentage >= 70 ? 'text-red-600 dark:text-red-400' : log.risk_percentage >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                                                                        {log.risk_percentage}%
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {loginLogs.prev_page_url || loginLogs.next_page_url ? (
                                    <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">Page {loginLogs.current_page ?? 1} of {loginLogs.last_page ?? 1}</span>
                                        <div className="flex gap-2">
                                            {loginLogs.prev_page_url && <Link href={loginLogs.prev_page_url} className="text-primary-600 dark:text-primary-400 hover:underline">← Prev</Link>}
                                            {loginLogs.next_page_url && <Link href={loginLogs.next_page_url} className="text-primary-600 dark:text-primary-400 hover:underline">Next →</Link>}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {/* Log detail modal */}
                {selectedLog && <LoginLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

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
