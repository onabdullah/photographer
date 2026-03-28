import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Loader, Lightbulb, Info, Plus, Sparkles, Cog, Layers } from 'lucide-react';
import axios from 'axios';

const LIGHT_SOURCES = ['None', 'Left Light', 'Right Light', 'Top Light', 'Bottom Light'];
const OUTPUT_FORMATS = ['webp', 'jpg', 'png'];
const WIDTHS = [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024];
const HEIGHTS = [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024];
const CFG_MIN = 1;
const CFG_MAX = 32;
const STEPS_MIN = 1;
const STEPS_MAX = 100;
const HIGHRES_SCALE_MIN = 1;
const HIGHRES_SCALE_MAX = 3;
const LOWRES_DENOISE_MIN = 0.1;
const LOWRES_DENOISE_MAX = 1;
const HIGHRES_DENOISE_MIN = 0.1;
const HIGHRES_DENOISE_MAX = 1;
const OUTPUT_QUALITY_MIN = 0;
const OUTPUT_QUALITY_MAX = 100;
const NUM_IMAGES_MIN = 1;
const NUM_IMAGES_MAX = 12;
const COST_PER_IMAGE = 0.0035;

const DEFAULT_LIGHTING_PRESETS = [
  { value: 'custom', label: 'Custom (type your own)', prompt: '' },
];

function slugifyPresetValue(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePresets(presets) {
  const source = Array.isArray(presets) ? presets : DEFAULT_LIGHTING_PRESETS;
  const used = new Set();
  const normalized = [];

  source.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    const label = String(item.label || '').trim();
    const prompt = String(item.prompt || '').trim();
    const computedValue = slugifyPresetValue(item.value || label);

    if (!computedValue || computedValue === 'custom' || used.has(computedValue)) return;
    if (!label) return;

    used.add(computedValue);
    normalized.push({
      value: computedValue,
      label,
      prompt,
    });
  });

  return [...DEFAULT_LIGHTING_PRESETS, ...normalized];
}

export default function LightingFixSettingsModal({ isOpen, onClose, onSave }) {
  const TAB_LIGHTING = 'lighting_settings';
  const TAB_PRODUCT_AI_LAB = 'product_ai_lab_settings';

  // Performance optimization: Cache & lazy loading
  const cacheRef = useRef(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_LIGHTING);

  // Settings state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    model_version: '',
    appended_prompt: 'best quality',
    negative_prompt: 'lowres, bad anatomy, bad hands, cropped, worst quality',
    default_light_source: 'None',
    default_output_format: 'webp',
    default_width: 512,
    default_height: 640,
    default_cfg: 2,
    default_steps: 25,
    default_highres_scale: 1.5,
    default_lowres_denoise: 0.9,
    default_highres_denoise: 0.5,
    default_output_quality: 80,
    default_number_of_images: 1,
    presets: DEFAULT_LIGHTING_PRESETS,
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
      const response = await axios.get('/admin/lighting-fix-settings?format=minimal');
      const newSettings = {
        ...response.data.settings,
        presets: normalizePresets(response.data.settings?.presets),
      };

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
      setActiveTab(TAB_LIGHTING);

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
      const payload = {
        ...settings,
        presets: normalizePresets(settings.presets)
      };
      await axios.put('/admin/lighting-fix-settings', payload);
      cacheRef.current = payload; // Update cache
      setSettings(payload);
      setOriginalSettings(payload);
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
      const response = await axios.post('/admin/lighting-fix-settings/reset');
      const newSettings = {
        ...response.data.settings,
        presets: normalizePresets(response.data.settings?.presets),
      };
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

  const updatePreset = (index, key, value) => {
    const nextPresets = [...(settings.presets || DEFAULT_LIGHTING_PRESETS)];
    if (!nextPresets[index]) return;

    nextPresets[index] = {
      ...nextPresets[index],
      [key]: value,
    };

    if (key === 'label') {
      nextPresets[index].value = slugifyPresetValue(value);
    }

    setSettings({
      ...settings,
      presets: nextPresets,
    });
  };

  const addPreset = () => {
    const nextPresets = [...(settings.presets || DEFAULT_LIGHTING_PRESETS), {
      value: `new_preset_${Date.now()}`,
      label: 'New preset',
      prompt: '',
    }];

    setSettings({
      ...settings,
      presets: nextPresets,
    });
  };

  const removePreset = (index) => {
    const nextPresets = [...(settings.presets || DEFAULT_LIGHTING_PRESETS)];
    const target = nextPresets[index];
    if (!target || target.value === 'custom') return;

    nextPresets.splice(index, 1);
    setSettings({
      ...settings,
      presets: nextPresets,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Lightbulb size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lighting Fix Settings</h2>
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

        {/* Tabs */}
        {hasLoadedOnce && (
          <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 pb-2">
            <button
              onClick={() => setActiveTab(TAB_LIGHTING)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === TAB_LIGHTING
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Cog size={16} />
              Settings
            </button>
            <button
              onClick={() => setActiveTab(TAB_PRODUCT_AI_LAB)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === TAB_PRODUCT_AI_LAB
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Layers size={16} />
              Presets
            </button>
          </div>
        )}

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

          {hasLoadedOnce && activeTab === TAB_LIGHTING && (
            <div className="space-y-6">
              {/* Model Version */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb size={16} className="text-primary-600" />
                  Model Version
                  <div className="group relative">
                    <Info size={16} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      The version hash of the IC-Light model from Replicate
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={settings.model_version || ''}
                  onChange={e => setSettings({ ...settings, model_version: e.target.value })}
                  placeholder="e.g., zsxkib/ic-light:d41bcb10... or version hash"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use full Replicate version (owner/model:hash) or just the hash.</p>
              </div>

              {/* Prompts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Prompts</h3>
                <div className="space-y-4 pl-6">
                  {/* Appended Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span>Appended Prompt ({settings.appended_prompt?.length || 0}/2000)</span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Automatically appended to all prompts for quality enhancement
                        </div>
                      </div>
                    </label>
                    <textarea
                      value={settings.appended_prompt || ''}
                      onChange={e => setSettings({ ...settings, appended_prompt: e.target.value })}
                      placeholder="Text appended to user prompts for quality"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Automatically appended to user prompts</p>
                  </div>

                  {/* Negative Prompt */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span>Negative Prompt ({settings.negative_prompt?.length || 0}/2000)</span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Attributes to discourage in the generated images
                        </div>
                      </div>
                    </label>
                    <textarea
                      value={settings.negative_prompt || ''}
                      onChange={e => setSettings({ ...settings, negative_prompt: e.target.value })}
                      placeholder="Attributes to discourage in output"
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Discourage low-quality attributes in generation</p>
                  </div>
                </div>
              </div>

              {/* Image Parameters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Image Parameters</h3>
                <div className="space-y-4 pl-6">
                  {/* Light Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span>Default Light Source</span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          The type and position of lighting to apply to the background
                        </div>
                      </div>
                    </label>
                    <select
                      value={settings.default_light_source}
                      onChange={e => setSettings({ ...settings, default_light_source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      {LIGHT_SOURCES.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>

                  {/* Output Format */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <span>Default Output Format</span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          The image file format for generated output (WebP/JPEG/PNG)
                        </div>
                      </div>
                    </label>
                    <select
                      value={settings.default_output_format}
                      onChange={e => setSettings({ ...settings, default_output_format: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                    >
                      {OUTPUT_FORMATS.map(fmt => (
                        <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Width & Height Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span>Default Width</span>
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            Width of generated images in pixels
                          </div>
                        </div>
                      </label>
                      <select
                        value={settings.default_width}
                        onChange={e => setSettings({ ...settings, default_width: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        {WIDTHS.map(w => (
                          <option key={w} value={w}>{w}px</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span>Default Height</span>
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                            Height of generated images in pixels
                          </div>
                        </div>
                      </label>
                      <select
                        value={settings.default_height}
                        onChange={e => setSettings({ ...settings, default_height: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600"
                      >
                        {HEIGHTS.map(h => (
                          <option key={h} value={h}>{h}px</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inference Parameters */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Inference Parameters</h3>
                <div className="space-y-4 pl-6">
                  {/* CFG */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Default CFG (Classifier-Free Guidance): <span className="font-bold text-primary-600">{settings.default_cfg}</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Higher = adhere to prompt, lower = creative interpretation
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={CFG_MIN}
                      max={CFG_MAX}
                      step="0.5"
                      value={settings.default_cfg}
                      onChange={e => setSettings({ ...settings, default_cfg: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{CFG_MIN}</span>
                      <span>{CFG_MAX}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Higher values = more adherence to prompt, lower = more creative
                    </p>
                  </div>

                  {/* Steps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Default Steps: <span className="font-bold text-primary-600">{settings.default_steps}</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Number of diffusion steps (more = better quality, slower)
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={STEPS_MIN}
                      max={STEPS_MAX}
                      step="1"
                      value={settings.default_steps}
                      onChange={e => setSettings({ ...settings, default_steps: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{STEPS_MIN}</span>
                      <span>{STEPS_MAX}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      More steps = better quality but slower processing
                    </p>
                  </div>

                  {/* Highres Scale */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Highres Scale: <span className="font-bold text-primary-600">{settings.default_highres_scale.toFixed(2)}×</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Resolution multiplier for final output
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={HIGHRES_SCALE_MIN}
                      max={HIGHRES_SCALE_MAX}
                      step="0.1"
                      value={settings.default_highres_scale}
                      onChange={e => setSettings({ ...settings, default_highres_scale: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{HIGHRES_SCALE_MIN}×</span>
                      <span>{HIGHRES_SCALE_MAX}×</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Resolution multiplier for final output
                    </p>
                  </div>

                  {/* Lowres Denoise */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Lowres Denoise: <span className="font-bold text-primary-600">{settings.default_lowres_denoise.toFixed(2)}</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Denoising for initial latent generation
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={LOWRES_DENOISE_MIN}
                      max={LOWRES_DENOISE_MAX}
                      step="0.1"
                      value={settings.default_lowres_denoise}
                      onChange={e => setSettings({ ...settings, default_lowres_denoise: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{LOWRES_DENOISE_MIN}</span>
                      <span>{LOWRES_DENOISE_MAX}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Higher = more adherence to background, lower = more creative
                    </p>
                  </div>

                  {/* Highres Denoise */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Highres Denoise: <span className="font-bold text-primary-600">{settings.default_highres_denoise.toFixed(2)}</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Denoising for high-resolution refinement
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={HIGHRES_DENOISE_MIN}
                      max={HIGHRES_DENOISE_MAX}
                      step="0.1"
                      value={settings.default_highres_denoise}
                      onChange={e => setSettings({ ...settings, default_highres_denoise: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{HIGHRES_DENOISE_MIN}</span>
                      <span>{HIGHRES_DENOISE_MAX}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Higher = more adherence to upscale, lower = more creative details
                    </p>
                  </div>

                  {/* Output Quality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Output Quality: <span className="font-bold text-primary-600">{settings.default_output_quality}%</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          Compression quality for lossy formats
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={OUTPUT_QUALITY_MIN}
                      max={OUTPUT_QUALITY_MAX}
                      step="1"
                      value={settings.default_output_quality}
                      onChange={e => setSettings({ ...settings, default_output_quality: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{OUTPUT_QUALITY_MIN}%</span>
                      <span>{OUTPUT_QUALITY_MAX}%</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Compression quality for lossy formats (JPEG/WebP)
                    </p>
                  </div>

                  {/* Number of Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span>Number of Images: <span className="font-bold text-primary-600">{settings.default_number_of_images}</span></span>
                      <div className="group relative">
                        <Info size={14} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help flex-shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          How many unique images to generate per request
                        </div>
                      </div>
                    </label>
                    <input
                      type="range"
                      min={NUM_IMAGES_MIN}
                      max={NUM_IMAGES_MAX}
                      step="1"
                      value={settings.default_number_of_images}
                      onChange={e => setSettings({ ...settings, default_number_of_images: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{NUM_IMAGES_MIN}</span>
                      <span>{NUM_IMAGES_MAX}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      How many unique images to generate per request
                    </p>
                  </div>
                </div>
              </div>

              {/* Cost Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  💰 Cost per image: <span className="font-semibold">${COST_PER_IMAGE}/img</span>
                </p>
              </div>
            </div>
          )}

          {hasLoadedOnce && activeTab === TAB_PRODUCT_AI_LAB && (
            <div className="space-y-6">
              {/* Presets */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lighting Presets</h3>
                  <button
                    type="button"
                    onClick={addPreset}
                    className="px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-md transition flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add preset
                  </button>
                </div>

                {(() => {
                  const allPresets = settings.presets || DEFAULT_LIGHTING_PRESETS;
                  const editablePresets = allPresets.filter((preset) => preset.value !== 'custom');

                  return (
                    <div className="space-y-4">
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Custom preset (system)</div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          This option is intentionally fixed. Users can type their own custom lighting prompt when they pick
                          <span className="font-medium"> Custom </span>
                          in AI Studio.
                        </p>
                      </div>

                      {editablePresets.length === 0 && (
                        <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                          No custom presets yet. Click
                          <span className="font-medium"> Add preset </span>
                          to create your first one.
                        </div>
                      )}

                      {editablePresets.map((preset, index) => {
                        const presetIndex = allPresets.findIndex((item) => item === preset);

                        return (
                          <div key={`preset-${presetIndex}`} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Preset {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removePreset(presetIndex)}
                                className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded"
                                aria-label="Remove preset"
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preset name</label>
                                <input
                                  type="text"
                                  value={preset.label || ''}
                                  onChange={(e) => updatePreset(presetIndex, 'label', e.target.value)}
                                  maxLength={80}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Preset prompt</label>
                                <textarea
                                  value={preset.prompt || ''}
                                  onChange={(e) => updatePreset(presetIndex, 'prompt', e.target.value)}
                                  maxLength={1000}
                                  rows="3"
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{(preset.prompt || '').length}/1000</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
