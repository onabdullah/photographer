import React, { useState, useEffect } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { useAdminToast } from '@/Admin/Components/AdminToast';
import { Loader, Save, RotateCcw } from 'lucide-react';
import axios from 'axios';

const RESOLUTIONS = ['1K', '2K', '4K'];
const ASPECT_RATIOS = [
  'match_input_image',
  '1:1',
  '1:4',
  '1:8',
  '2:3',
  '3:2',
  '3:4',
  '4:1',
  '4:3',
  '4:5',
  '5:4',
  '8:1',
  '9:16',
  '16:9',
  '21:9',
];
const OUTPUT_FORMATS = ['jpg', 'png'];

export default function NanoBananaSettings() {
  const toast = useAdminToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/nano-banana-settings');
      setConfig(response.data.config);
      setSettings(response.data.settings);
      setFormData({
        default_aspect_ratio: response.data.settings.default_aspect_ratio,
        default_resolution: response.data.settings.default_resolution,
        default_output_format: response.data.settings.default_output_format,
        prompt_template: response.data.settings.prompt_template || '',
        features_enabled: response.data.settings.features_enabled || {},
        cost_guardrails: response.data.settings.cost_guardrails || {},
        advanced_config: response.data.settings.advanced_config || {},
      });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFeatureToggle = (feature, enabled) => {
    setFormData(prev => ({
      ...prev,
      features_enabled: {
        ...prev.features_enabled,
        [feature]: enabled,
      },
    }));
  };

  const handleCostGuardrailChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      cost_guardrails: {
        ...prev.cost_guardrails,
        [field]: value,
      },
    }));
  };

  const handleAdvancedChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      advanced_config: {
        ...prev.advanced_config,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put('/admin/nano-banana-settings', formData);
      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to config defaults?')) return;
    try {
      setSaving(true);
      await axios.post('/admin/nano-banana-settings/reset');
      toast.success('Settings reset to defaults');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Nano Banana 2 Configuration">
        <div className="flex items-center justify-center py-20">
          <Loader className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout title="Nano Banana 2 Configuration">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-200">
          Failed to load settings
        </div>
      </AdminLayout>
    );
  }

  const costPerRes = config?.cost_per_resolution || {};
  const costMult = config?.cost_multiplier_with_search || 1.5;

  return (
    <AdminLayout title="Nano Banana 2 Configuration">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Main Configuration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configuration</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure how the Nano Banana 2 model behaves. All changes apply instantly to new generations.
            </p>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Defaults Section */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Defaults</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Aspect Ratio
                </label>
                <select
                  value={formData.default_aspect_ratio || 'match_input_image'}
                  onChange={e => handleInputChange('default_aspect_ratio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {ASPECT_RATIOS.map(ar => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Resolution
                </label>
                <select
                  value={formData.default_resolution || '1K'}
                  onChange={e => handleInputChange('default_resolution', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {RESOLUTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Output Format
                </label>
                <select
                  value={formData.default_output_format || 'jpg'}
                  onChange={e => handleInputChange('default_output_format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {OUTPUT_FORMATS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Feature Flags */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Feature Flags</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features_enabled?.google_search || false}
                  onChange={e => handleFeatureToggle('google_search', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Google Search Grounding</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Use real-time web search to ground generations (+50% API cost)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features_enabled?.image_search || false}
                  onChange={e => handleFeatureToggle('image_search', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Image Search Grounding</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Use web image search to ground generations (+50% API cost)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.features_enabled?.seed_reproducibility !== false}
                  onChange={e => handleFeatureToggle('seed_reproducibility', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Seed Reproducibility</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Allow users to specify seed for reproducible results
                  </div>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Cost Guardrails */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Cost Guardrails</h3>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Pricing per Generation:</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1K: ${costPerRes['1K']?.toFixed(3)},
                  2K: ${costPerRes['2K']?.toFixed(3)},
                  4K: ${costPerRes['4K']?.toFixed(3)}
                </div>
                {(formData.features_enabled?.google_search || formData.features_enabled?.image_search) && (
                  <div className="text-sm text-amber-600 dark:text-amber-400">
                    Search enabled: costs × {costMult}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Cost Per Generation (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={String(formData.cost_guardrails?.max_cost_usd || '')}
                  onChange={e => handleCostGuardrailChange('max_cost_usd', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., 0.50 (leave empty for no limit)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Prevent generations exceeding this cost threshold
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cost_guardrails?.allow_google_search !== false}
                  onChange={e => handleCostGuardrailChange('allow_google_search', e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Google Search Grounding</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cost_guardrails?.allow_image_search !== false}
                  onChange={e => handleCostGuardrailChange('allow_image_search', e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allow Image Search Grounding</span>
              </label>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Advanced Config */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Advanced Parameters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Guidance Scale
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={String(formData.advanced_config?.guidance_scale || '')}
                  onChange={e => handleAdvancedChange('guidance_scale', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="0.0 - 20.0 (leave empty for Replicate default)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Higher = more adherence to prompt. Leave empty for Replicate default.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Num Inference Steps
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={String(formData.advanced_config?.num_inference_steps || '')}
                  onChange={e => handleAdvancedChange('num_inference_steps', e.target.value ? parseInt(e.target.value, 10) : undefined)}
                  placeholder="1 - 100 (leave empty for Replicate default)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  More steps = better quality but slower. Leave empty for Replicate default.
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Prompt Template */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prompt Template (Optional)</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prepend to User Prompts
              </label>
              <textarea
                value={formData.prompt_template || ''}
                onChange={e => handleInputChange('prompt_template', e.target.value)}
                placeholder="e.g., 'Always use professional photography lighting. Keep colors vibrant and true to life.'"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This text is prepended to all user prompts. Leave empty for no template.
              </p>
            </div>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'N/A'}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                disabled={loading || saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RotateCcw size={16} />
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                disabled={loading || saving}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* About Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">About Nano Banana 2</h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Google's Gemini-powered model on Replicate. Supports multimodal input (product + reference images for style, face, pose matching).
            </p>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">Model Version:</span>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-xs font-mono break-all text-gray-600 dark:text-gray-400">
                {config?.model_version}
              </div>
            </div>
            <p>
              Supports up to 14 images per request. Reference images help guide the model.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
