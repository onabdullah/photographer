import { useState, useEffect } from 'react';
import { Settings2, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

/**
 * NanoBananaSettings – Admin panel for Nano Banana 2 (google/nano-banana-2) configuration.
 * 
 * Features:
 * - Safe presets (Balanced, Quality, Fast)
 * - Advanced field controls (resolution, output_format, aspect_ratio, seed, image/google search)
 * - Prompt template management
 * - Cost guardrails
 * - Real-time config preview
 */
export default function NanoBananaSettings() {
    const [settings, setSettings] = useState(null);
    const [presets, setPresets] = useState({});
    const [supportedFields, setSupportedFields] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
    const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'advanced' | 'preview'

    // Form state for advanced controls
    const [formData, setFormData] = useState({
        model_version: '',
        default_resolution: '1K',
        default_aspect_ratio: 'match_input_image',
        default_output_format: 'jpg',
        prompt_template: '',
        current_preset: 'balanced',
        features_enabled: {
            google_search: false,
            image_search: false,
        },
        cost_guardrails: {
            max_cost_usd: '',
            enabled_resolutions: ['1K', '2K', '4K'],
            allow_google_search: true,
            allow_image_search: true,
        },
    });

    // Fetch current settings on mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/admin/ai-studio-tools/nano-banana/settings');
                if (!response.ok) throw new Error('Failed to fetch settings');
                const data = await response.json();
                setSettings(data.settings);
                setPresets(data.presets || {});
                setSupportedFields(data.supported_fields || {});
                setFormData({
                    model_version: data.settings.model_version || '',
                    default_resolution: data.settings.default_resolution || '1K',
                    default_aspect_ratio: data.settings.default_aspect_ratio || 'match_input_image',
                    default_output_format: data.settings.default_output_format || 'jpg',
                    prompt_template: data.settings.prompt_template || '',
                    current_preset: data.settings.current_preset || 'balanced',
                    features_enabled: data.settings.features_enabled || {},
                    cost_guardrails: {
                        max_cost_usd: data.settings.cost_guardrails?.max_cost_usd ?? '',
                        enabled_resolutions: data.settings.cost_guardrails?.enabled_resolutions || ['1K', '2K', '4K'],
                        allow_google_search: data.settings.cost_guardrails?.allow_google_search ?? true,
                        allow_image_search: data.settings.cost_guardrails?.allow_image_search ?? true,
                    },
                });
            } catch (err) {
                console.error('Error fetching Nano Banana settings:', err);
                setSubmitStatus({ type: 'error', message: 'Failed to load settings' });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handlePresetApply = async (presetName) => {
        setSaving(true);
        setSubmitStatus(null);
        try {
            const response = await fetch('/admin/ai-studio-tools/nano-banana/preset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content },
                body: JSON.stringify({ preset_name: presetName }),
            });
            if (!response.ok) throw new Error('Failed to apply preset');
            const data = await response.json();
            setSettings(data.settings);
            setFormData(prev => ({
                ...prev,
                current_preset: presetName,
                default_resolution: presets[presetName]?.resolution || prev.default_resolution,
                default_output_format: presets[presetName]?.output_format || prev.default_output_format,
            }));
            setSubmitStatus({ type: 'success', message: `Preset "${presetName}" applied!` });
        } catch (err) {
            console.error('Error applying preset:', err);
            setSubmitStatus({ type: 'error', message: 'Failed to apply preset' });
        } finally {
            setSaving(false);
        }
    };

    const handleAdvancedSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSubmitStatus(null);
        try {
            const response = await fetch('/admin/ai-studio-tools/nano-banana/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content },
                body: JSON.stringify(formData),
            });
            if (!response.ok) throw new Error('Failed to save settings');
            const data = await response.json();
            setSettings(data.settings);
            setSubmitStatus({ type: 'success', message: 'Settings saved successfully!' });
        } catch (err) {
            console.error('Error saving settings:', err);
            setSubmitStatus({ type: 'error', message: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSubmitStatus(null);
    };

    const handleFeatureToggle = (featureName, enabled) => {
        setFormData(prev => ({
            ...prev,
            features_enabled: {
                ...prev.features_enabled,
                [featureName]: enabled,
            },
        }));
        setSubmitStatus(null);
    };

    const handleGuardrailChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            cost_guardrails: {
                ...prev.cost_guardrails,
                [field]: value,
            },
        }));
        setSubmitStatus(null);
    };

    const handleResolutionPolicyToggle = (resolution, enabled) => {
        const current = Array.isArray(formData.cost_guardrails?.enabled_resolutions)
            ? formData.cost_guardrails.enabled_resolutions
            : [];
        const next = enabled
            ? Array.from(new Set([...current, resolution]))
            : current.filter((r) => r !== resolution);
        handleGuardrailChange('enabled_resolutions', next);
    };

    if (loading) {
        return (
            <div className="card p-8 flex items-center justify-center gap-3">
                <Loader2 size={18} className="animate-spin text-primary-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Loading Nano Banana settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Settings2 size={20} className="text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Nano Banana 2 Configuration
                </h2>
            </div>

            {/* Status message */}
            {submitStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    submitStatus.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/30'
                }`}>
                    {submitStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-sm">{submitStatus.message}</span>
                </div>
            )}

            {/* Tab navigation */}
            <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[
                    { id: 'presets', label: 'Safe Presets' },
                    { id: 'advanced', label: 'Advanced Controls' },
                    { id: 'preview', label: 'Configuration Preview' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* PRESETS TAB */}
            {activeTab === 'presets' && (
                <div className="space-y-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Select a preset to quickly configure Nano Banana for a specific use case. Presets are recommended for most setups.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {Object.entries(presets).map(([presetKey, preset]) => (
                            <div
                                key={presetKey}
                                className="card p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            >
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    {preset.label}
                                </h3>
                                <div className="space-y-1 mb-3 text-xs text-gray-600 dark:text-gray-400">
                                    <p><strong>Resolution:</strong> {preset.resolution}</p>
                                    <p><strong>Format:</strong> {preset.output_format}</p>
                                    <p><strong>Steps:</strong> {preset.num_inference_steps}</p>
                                    <p><strong>Guidance:</strong> {preset.guidance_scale}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handlePresetApply(presetKey)}
                                    disabled={saving || formData.current_preset === presetKey}
                                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        formData.current_preset === presetKey
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700/50'
                                            : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50'
                                    }`}
                                >
                                    {formData.current_preset === presetKey ? '✓ Active' : 'Apply'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ADVANCED CONTROLS TAB */}
            {activeTab === 'advanced' && (
                <form onSubmit={handleAdvancedSave} className="space-y-4">
                    {/* Model Version */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Model Version Hash
                        </label>
                        <input
                            type="text"
                            value={formData.model_version}
                            onChange={(e) => handleInputChange('model_version', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                            placeholder="google/nano-banana-2:..."
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Replicate model version identifier. Change only when testing new versions.
                        </p>
                    </div>

                    {/* Resolution */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Default Resolution
                        </label>
                        <select
                            value={formData.default_resolution}
                            onChange={(e) => handleInputChange('default_resolution', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                        >
                            {(supportedFields.resolution || ['1K', '2K', '4K']).map(res => (
                                <option key={res} value={res}>{res}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Higher resolutions produce better quality but cost more and take longer.
                        </p>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Default Aspect Ratio
                        </label>
                        <select
                            value={formData.default_aspect_ratio}
                            onChange={(e) => handleInputChange('default_aspect_ratio', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                        >
                            {(supportedFields.aspect_ratio || []).map(ratio => (
                                <option key={ratio} value={ratio}>{ratio}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            match_input_image preserves source dimensions.
                        </p>
                    </div>

                    {/* Output Format */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            Default Output Format
                        </label>
                        <select
                            value={formData.default_output_format}
                            onChange={(e) => handleInputChange('default_output_format', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                        >
                            {(supportedFields.output_format || ['jpg', 'png']).map(fmt => (
                                <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            JPG is smaller; PNG supports transparency.
                        </p>
                    </div>

                    {/* Prompt Template */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                            System Prompt Template
                        </label>
                        <textarea
                            value={formData.prompt_template}
                            onChange={(e) => handleInputChange('prompt_template', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                            rows="4"
                            placeholder="E.g. You are a professional product photography AI. Preserve all product details and text..."
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Base instruction prepended to all merchant prompts. Use to enforce brand guidelines or quality standards.
                        </p>
                    </div>

                    {/* Feature Toggles */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Advanced Features
                        </h3>
                        <div className="space-y-2">
                            {['google_search', 'image_search'].map(feature => (
                                <label key={feature} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <input
                                        type="checkbox"
                                        checked={formData.features_enabled[feature] || false}
                                        onChange={(e) => handleFeatureToggle(feature, e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                            {feature.replace('_', ' ')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {feature === 'google_search' && 'Allow web search grounding (+50% cost)'}
                                            {feature === 'image_search' && 'Allow image search grounding (+50% cost)'}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                            Cost Guardrails
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    Max Cost Per Generation (USD)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={formData.cost_guardrails?.max_cost_usd ?? ''}
                                    onChange={(e) => handleGuardrailChange('max_cost_usd', e.target.value === '' ? '' : Number(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
                                    placeholder="Leave blank for no cap"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    If estimated cost exceeds this value, request will be blocked.
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Allowed Resolutions</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1K', '2K', '4K'].map((res) => (
                                        <label key={res} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={(formData.cost_guardrails?.enabled_resolutions || []).includes(res)}
                                                onChange={(e) => handleResolutionPolicyToggle(res, e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-900 dark:text-gray-100">{res}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={!!formData.cost_guardrails?.allow_google_search}
                                        onChange={(e) => handleGuardrailChange('allow_google_search', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">Allow Google Search</span>
                                </label>
                                <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={!!formData.cost_guardrails?.allow_image_search}
                                        onChange={(e) => handleGuardrailChange('allow_image_search', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-900 dark:text-gray-100">Allow Image Search</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Advanced Settings'}
                    </button>
                </form>
            )}

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && settings && (
                <div className="card p-4 space-y-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        Current resolved configuration that will be used at runtime.
                    </p>
                    <div className="space-y-2 font-mono text-xs">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">Model Version:</p>
                            <p className="text-gray-900 dark:text-gray-100 break-all">{settings.model_version}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">Resolution:</p>
                                <p className="text-gray-900 dark:text-gray-100">{settings.default_resolution}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">Format:</p>
                                <p className="text-gray-900 dark:text-gray-100">{settings.default_output_format}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">Aspect Ratio:</p>
                            <p className="text-gray-900 dark:text-gray-100">{settings.default_aspect_ratio}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">Preset:</p>
                            <p className="text-gray-900 dark:text-gray-100 capitalize">{settings.current_preset}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">Features:</p>
                            <p className="text-gray-900 dark:text-gray-100">
                                {JSON.stringify(settings.features_enabled, null, 2)}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-gray-500 dark:text-gray-400">Cost Guardrails:</p>
                            <p className="text-gray-900 dark:text-gray-100">
                                {JSON.stringify(settings.cost_guardrails || {}, null, 2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
