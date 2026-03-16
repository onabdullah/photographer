import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Upload, Check, AlertCircle, RotateCcw } from 'lucide-react';

const ALL_TOOLS = [
    { key: 'magic_eraser', label: 'Magic Eraser' },
    { key: 'remove_bg', label: 'Background Remover' },
    { key: 'compressor', label: 'Image Compressor' },
    { key: 'upscale', label: 'Upscaler' },
    { key: 'enhance', label: 'Image Enhancer' },
    { key: 'lighting', label: 'Lighting Fix' },
];

export default function DashboardSettings({
    heroSettings,
    featuredToolsSettings,
    announcementSettings,
    availableTools,
}) {
    const { data, setData, post, processing, errors } = useForm({
        heroTitle: heroSettings?.title || '',
        heroSubtitle: heroSettings?.subtitle || '',
        heroImageUrl: heroSettings?.imageUrl || '',
        featuredToolsEnabled: featuredToolsSettings?.enabled || false,
        featuredTools: featuredToolsSettings?.tools || [],
        announcementEnabled: announcementSettings?.enabled || false,
        announcementText: announcementSettings?.text || '',
    });

    const [message, setMessage] = useState(null);
    const [imageUpload, setImageUpload] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [imagePreview, setImagePreview] = useState(heroSettings?.imageUrl);

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be smaller than 2MB.' });
            return;
        }

        setImageUpload(file);
        const preview = URL.createObjectURL(file);
        setImagePreview(preview);
    };

    const uploadImage = async () => {
        if (!imageUpload) return;

        const formData = new FormData();
        formData.append('image', imageUpload);

        try {
            const response = await fetch('/admin/dashboard-media/upload-hero', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                setMessage({ type: 'error', text: result.error || 'Upload failed.' });
                return;
            }

            setData('heroImageUrl', result.url);
            setImageUpload(null);
            setMessage({ type: 'success', text: 'Image uploaded successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to upload image.' });
        }
    };

    const toggleTool = (toolKey) => {
        const tools = data.featuredTools || [];
        if (tools.includes(toolKey)) {
            setData('featuredTools', tools.filter((t) => t !== toolKey));
        } else {
            setData('featuredTools', [...tools, toolKey]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/dashboard-settings', {
            onSuccess: () => {
                setMessage({ type: 'success', text: 'Dashboard settings updated successfully!' });
            },
            onError: (err) => {
                setMessage({ type: 'error', text: 'Failed to update settings.' });
            },
        });
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults? This cannot be undone.')) {
            post('/admin/dashboard-settings/reset', {
                onSuccess: () => {
                    window.location.reload();
                },
            });
        }
    };

    return (
        <AdminLayout
            title="Dashboard Settings"
            breadcrumbs={[{ label: 'Settings' }, { label: 'Dashboard Content' }]}
        >
            <div className="space-y-6">
                {/* Message Alert */}
                {message && (
                    <div
                        className={`flex items-start gap-3 p-4 rounded-lg border ${
                            message.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        }`}
                    >
                        <div
                            className={`mt-1 flex-shrink-0 ${
                                message.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                            }`}
                        >
                            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <span className={message.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                            {message.text}
                        </span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Hero Section ── */}
                    <div className="card-base overflow-hidden">
                        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hero Section</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Customize the hero section that appears at the top of the merchant dashboard.
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Hero Title
                                </label>
                                <input
                                    type="text"
                                    value={data.heroTitle}
                                    onChange={(e) => setData('heroTitle', e.target.value)}
                                    placeholder="e.g., Let's grow your business together"
                                    maxLength={255}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                />
                                {errors.heroTitle && (
                                    <p className="text-red-500 text-xs mt-1">{errors.heroTitle}</p>
                                )}
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Hero Subtitle
                                </label>
                                <textarea
                                    value={data.heroSubtitle}
                                    onChange={(e) => setData('heroSubtitle', e.target.value)}
                                    placeholder="Describe your offer..."
                                    maxLength={500}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                />
                                {errors.heroSubtitle && (
                                    <p className="text-red-500 text-xs mt-1">{errors.heroSubtitle}</p>
                                )}
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Hero Image
                                </label>
                                <div className="space-y-3">
                                    {/* Preview */}
                                    {imagePreview && (
                                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
                                            <img
                                                src={imagePreview}
                                                alt="Hero preview"
                                                className="w-full h-48 object-cover"
                                            />
                                        </div>
                                    )}

                                    {/* Upload Area */}
                                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="text-center">
                                            <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Drag and drop image here
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                or click to select (JPG, PNG, WebP, max 2MB)
                                            </p>
                                        </div>
                                    </div>

                                    {/* Upload Button & Image URL Input */}
                                    <div className="flex gap-3">
                                        {imageUpload && (
                                            <button
                                                type="button"
                                                onClick={uploadImage}
                                                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                                            >
                                                Upload Image
                                            </button>
                                        )}
                                        <input
                                            type="url"
                                            value={data.heroImageUrl}
                                            onChange={(e) => setData('heroImageUrl', e.target.value)}
                                            placeholder="Or paste image URL directly"
                                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                        />
                                    </div>

                                    {errors.heroImageUrl && (
                                        <p className="text-red-500 text-xs">{errors.heroImageUrl}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Featured Tools ── */}
                    <div className="card-base overflow-hidden">
                        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Tools</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Select which tools appear in the featured section of the dashboard.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="featured-tools-enabled"
                                    checked={data.featuredToolsEnabled}
                                    onChange={(e) => setData('featuredToolsEnabled', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                />
                                <label
                                    htmlFor="featured-tools-enabled"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                >
                                    Show featured tools section
                                </label>
                            </div>

                            {/* Tools List */}
                            {data.featuredToolsEnabled && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    {ALL_TOOLS.map((tool) => (
                                        <label
                                            key={tool.key}
                                            className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={data.featuredTools?.includes(tool.key) || false}
                                                onChange={() => toggleTool(tool.key)}
                                                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {tool.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {errors.featuredTools && (
                                <p className="text-red-500 text-xs">{errors.featuredTools}</p>
                            )}
                        </div>
                    </div>

                    {/* ── Announcements ── */}
                    <div className="card-base overflow-hidden">
                        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-6 py-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Announcement Banner</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Display a temporary announcement at the top of merchant dashboards.
                            </p>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="announcement-enabled"
                                    checked={data.announcementEnabled}
                                    onChange={(e) => setData('announcementEnabled', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                />
                                <label
                                    htmlFor="announcement-enabled"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                                >
                                    Show announcement
                                </label>
                            </div>

                            {/* Text */}
                            {data.announcementEnabled && (
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                        Announcement Text
                                    </label>
                                    <textarea
                                        value={data.announcementText}
                                        onChange={(e) => setData('announcementText', e.target.value)}
                                        placeholder="e.g., New feature available: Background remover for all users!"
                                        maxLength={1000}
                                        rows={2}
                                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                    />
                                    {errors.announcementText && (
                                        <p className="text-red-500 text-xs mt-1">{errors.announcementText}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={processing}
                            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Reset to Defaults
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
