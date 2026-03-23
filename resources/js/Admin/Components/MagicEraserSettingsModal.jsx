import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Loader, Wand2, SettingsIcon as SettingsIco } from 'lucide-react';
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

export default function MagicEraserSettingsModal({ isOpen, onClose, onSave }) {
  // Performance optimization: Cache & lazy loading
  const cacheRef = useRef(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Settings state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    model_version: '',
    prepend_prompt: '',
    default_resolution: '1K',
    default_aspect_ratio: 'match_input_image',
    default_output_format: 'jpg',
    resolution_credits: {
      '1K': 1,
      '2K': 2,
      '4K': 4,
    },
    enabled_aspect_ratios: [],
  });
  const [originalSettings, setOriginalSettings] = useState(null);

  const loadSettings = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);

      // Try cached data first (if exists)
      if (cacheRef.current && hasLoadedOnce && isCached) {
        setSettings(cacheRef.current);
        setOriginalSettings(cacheRef.current);
      }

      // Fetch minimal settings (only settings, no config)
      const response = await axios.get('/admin/magic-eraser-settings?format=minimal');
      const newSettings = response.data.settings;

      // Update cache and state
      cacheRef.current = newSettings;
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setIsCached(true);

      if (!hasLoadedOnce) {
        setHasLoadedOnce(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // First open: fetch fresh
      if (!hasLoadedOnce) {
        loadSettings();
      } else if (hasLoadedOnce && isCached) {
        // Subsequent opens: use cached, refresh silently in background
        setIsRefreshing(true);
        loadSettings(true);
      }
    }
  }, [isOpen, hasLoadedOnce, isCached]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await axios.put('/admin/magic-eraser-settings', settings);
      cacheRef.current = settings; // Update cache
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
      const response = await axios.post('/admin/magic-eraser-settings/reset');
      const newSettings = response.data.settings;
      cacheRef.current = newSettings;
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setIsCached(true);
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
            <Wand2 size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Magic Eraser Settings</h2>
            {isRefreshing && <span className="text-xs font-medium text-gray-500">(refreshing...)</span>}
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
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {!hasLoadedOnce && (
            <div className="flex justify-center items-center py-12">
              <Loader size={32} className="animate-spin text-primary-600" />
            </div>
          )}

          {hasLoadedOnce && (
            <div className="space-y-6">
              {/* Model Version */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Wand2 size={16} className="text-primary-600" />
                  Model Version
                </label>
                <input
                  type="text"
                  value={settings.model_version || ''}
                  onChange={e => setSettings({ ...settings, model_version: e.target.value })}
                  placeholder="e.g., google/nano-banana-2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Specify the model version used for erasing objects</p>
              </div>

              {/* Prepend Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Prepend Prompt (Optional)</label>
                <textarea
                  value={settings.prepend_prompt || ''}
                  onChange={e => setSettings({ ...settings, prepend_prompt: e.target.value.substring(0, 2000) })}
                  placeholder="e.g., 'high quality result, seamless blending, realistic texture'"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  This text will be prepended to all erase prompts for consistent quality.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {(settings.prepend_prompt || '').length}/2000 characters
                </p>
              </div>

              {/* API Parameters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <SettingsIco size={16} className="text-primary-600" />
                  API Parameters
                </h3>

                {/* Resolution Settings */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Resolution Settings</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Configure default resolution and merchant credit costs in one place.
                    </p>
                  </div>

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

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Resolution Credit Costs</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Set how many credits each resolution costs merchants.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {['1K', '2K', '4K'].map(res => (
                        <div key={res} className="space-y-1">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                            {res} Resolution
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              value={settings.resolution_credits?.[res] ?? (res === '1K' ? 1 : res === '2K' ? 2 : 4)}
                              onChange={e => {
                                setSettings({
                                  ...settings,
                                  resolution_credits: {
                                    ...settings.resolution_credits,
                                    [res]: Math.max(1, parseInt(e.target.value, 10) || 1),
                                  },
                                });
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">credits</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio Settings */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Aspect Ratio Settings</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Control default ratio and exactly which ratios merchants can select.
                    </p>
                  </div>

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
                      Aspect ratio for erased region (select "Match Input Image" to preserve input aspect)
                    </p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Visible Aspect Ratios to Merchants</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Choose which aspect ratios merchants can select. If none selected, all will be available.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {ASPECT_RATIOS.map(ar => (
                        <label key={ar} className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                          <input
                            type="checkbox"
                            checked={Array.isArray(settings.enabled_aspect_ratios) && settings.enabled_aspect_ratios.some(
                              item => (item.value || item) === ar
                            )}
                            onChange={e => {
                              const current = Array.isArray(settings.enabled_aspect_ratios) ? settings.enabled_aspect_ratios : [];
                              if (e.target.checked) {
                                setSettings({
                                  ...settings,
                                  enabled_aspect_ratios: [...current, { value: ar, label: ar === 'match_input_image' ? 'Match Input' : ar }],
                                });
                              } else {
                                setSettings({
                                  ...settings,
                                  enabled_aspect_ratios: current.filter(item => (item.value || item) !== ar),
                                });
                              }
                            }}
                            className="w-4 h-4 accent-primary-600 cursor-pointer rounded"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {ar === 'match_input_image' ? 'Match Input Image' : ar}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Output Format Settings */}
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Output Format Settings</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Configure the default output format for erased images.
                    </p>
                  </div>

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
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Choose JPG for smaller file sizes or PNG for transparency support.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {hasLoadedOnce && (
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
        )}
      </div>
    </div>
  );
}
