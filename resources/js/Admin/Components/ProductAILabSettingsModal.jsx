import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Loader, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';

// Exact from Replicate API schema: google/nano-banana-2
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

const COST_PER_RESOLUTION = {
  '1K': 0.067,
  '2K': 0.101,
  '4K': 0.151,
};

export default function ProductAILabSettingsModal({ isOpen, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    model_version: '',
    prepend_prompt: '',
    default_resolution: '1K',
    default_aspect_ratio: 'match_input_image',
    default_output_format: 'jpg',
    features_enabled: {
      google_search: false,
      image_search: false,
    },
  });
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/admin/product-ai-lab-settings');
      setSettings(response.data.settings);
      setOriginalSettings(response.data.settings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await axios.put('/admin/product-ai-lab-settings', settings);
      onSave?.();
      setTimeout(() => onClose(), 500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to system defaults? This action cannot be undone.')) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await axios.post('/admin/product-ai-lab-settings/reset');
      await loadSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product AI Lab Settings</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Model Version Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-primary-600" />
                    Model Version
                  </label>
                  <input
                    type="text"
                    value={settings.model_version || ''}
                    onChange={e => setSettings({ ...settings, model_version: e.target.value })}
                    placeholder="e.g., replicate-vto-2"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Specify the model version used for generating images</p>
                </div>

                {/* Prepend Prompt Section */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Prepend Prompt (Optional)</label>
                  <textarea
                    value={settings.prepend_prompt || ''}
                    onChange={e => setSettings({ ...settings, prepend_prompt: e.target.value.substring(0, 2000) })}
                    placeholder="e.g., 'high-quality product photo, professional lighting, 8K resolution'"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    This text will be prepended to all user prompts. Useful for consistent style/quality guidelines.
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {(settings.prepend_prompt || '').length}/2000 characters
                  </p>
                </div>

                {/* API Parameters Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <SettingsIcon size={16} className="text-primary-600" />
                    API Parameters
                  </h3>
                  <div className="space-y-4 pl-6">
                    {/* Default Resolution */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Resolution
                      </label>
                      <div className="space-y-2">
                        <select
                          value={settings.default_resolution || '1K'}
                          onChange={e => setSettings({ ...settings, default_resolution: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                        >
                          {RESOLUTIONS.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Cost per image: ~${COST_PER_RESOLUTION[settings.default_resolution || '1K']}/img
                        </p>
                      </div>
                    </div>

                    {/* Default Aspect Ratio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Aspect Ratio
                      </label>
                      <select
                        value={settings.default_aspect_ratio || 'match_input_image'}
                        onChange={e => setSettings({ ...settings, default_aspect_ratio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        {ASPECT_RATIOS.map(ar => (
                          <option key={ar} value={ar}>
                            {ar === 'match_input_image' ? 'Match Input Image (Default)' : ar}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Aspect ratio of generated images (select "Match Input Image" to preserve input aspect)
                      </p>
                    </div>

                    {/* Default Output Format */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Default Output Format
                      </label>
                      <select
                        value={settings.default_output_format || 'jpg'}
                        onChange={e => setSettings({ ...settings, default_output_format: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        {OUTPUT_FORMATS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Feature Toggles Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Search Grounding Features</h3>
                  <div className="space-y-3 pl-2">
                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <input
                        type="checkbox"
                        checked={settings.features_enabled?.google_search || false}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            features_enabled: {
                              ...settings.features_enabled,
                              google_search: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-primary-600 cursor-pointer rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition">
                          Google Search Grounding
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Use real-time web search for context (weather, sports scores, recent events, etc.)
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                          ⚠️ Increases API cost by 50%
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <input
                        type="checkbox"
                        checked={settings.features_enabled?.image_search || false}
                        onChange={e =>
                          setSettings({
                            ...settings,
                            features_enabled: {
                              ...settings.features_enabled,
                              image_search: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 accent-primary-600 cursor-pointer rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition">
                          Image Search Grounding
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Find and use web images as visual references for generation (automatically enables web search)
                        </div>
                        <div className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-1">
                          ⚠️ Increases API cost by 50%
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleReset}
            disabled={saving}
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
