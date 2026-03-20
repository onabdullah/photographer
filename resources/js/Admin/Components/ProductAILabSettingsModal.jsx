import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Loader, Sparkles, Settings as SettingsIcon, Plus, Edit2, Trash2, Layers } from 'lucide-react';
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

// Custom cache key
const SETTINGS_CACHE_KEY = 'product_ai_lab_settings_cache';

export default function ProductAILabSettingsModal({ isOpen, onClose, onSave }) {
  // Performance optimization: Cache & lazy loading
  const cacheRef = useRef(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Settings tab state
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

  // Reference types tab state
  const [activeTab, setActiveTab] = useState('settings');
  const [referenceTypes, setReferenceTypes] = useState([]);
  const [isAddingRefType, setIsAddingRefType] = useState(false);
  const [editingRefType, setEditingRefType] = useState(null);
  const [totalMaxImages, setTotalMaxImages] = useState(0);
  const [refTypeForm, setRefTypeForm] = useState({
    name: '',
    slug: '',
    description: '',
    prompt_template: '',
    max_images_allowed: 5,
    is_enabled: true,
  });

  // ============= SETTINGS TAB =============

  const loadSettings = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);

      // Try cached data first (if exists)
      if (cacheRef.current && hasLoadedOnce && isCached) {
        setSettings(cacheRef.current);
        setOriginalSettings(cacheRef.current);
      }

      // Fetch minimal settings (only settings, no config)
      const response = await axios.get('/admin/product-ai-lab-settings?format=minimal');
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

  const loadReferenceTypes = async () => {
    try {
      const response = await axios.get('/admin/product-ai-lab/reference-types');
      setReferenceTypes(response.data.reference_types);
      setTotalMaxImages(response.data.total_max_images);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reference types');
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

      // Load reference types when reference types tab is active
      if (activeTab === 'reference-types') {
        loadReferenceTypes();
      }
    }
  }, [isOpen, activeTab, hasLoadedOnce, isCached]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await axios.put('/admin/product-ai-lab-settings', settings);
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
      await axios.post('/admin/product-ai-lab-settings/reset');
      await loadSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // ============= REFERENCE TYPES TAB =============

  const handleAddRefType = async () => {
    if (!refTypeForm.name.trim()) {
      setError('Reference type name is required');
      return;
    }
    if (!refTypeForm.prompt_template.trim()) {
      setError('Prompt template is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingRefType) {
        // Update existing
        await axios.put(`/admin/product-ai-lab/reference-types/${editingRefType.id}`, refTypeForm);
      } else {
        // Create new
        await axios.post('/admin/product-ai-lab/reference-types', refTypeForm);
      }

      // Reload list
      await loadReferenceTypes();
      setIsAddingRefType(false);
      setEditingRefType(null);
      setRefTypeForm({
        name: '',
        slug: '',
        description: '',
        prompt_template: '',
        max_images_allowed: 5,
        is_enabled: true,
      });

      onSave?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save reference type');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRefType = async (id) => {
    if (!confirm('Delete this reference type? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await axios.delete(`/admin/product-ai-lab/reference-types/${id}`);
      await loadReferenceTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete reference type');
    } finally {
      setSaving(false);
    }
  };

  const handleEditRefType = (refType) => {
    setRefTypeForm(refType);
    setEditingRefType(refType);
    setIsAddingRefType(true);
  };

  const handleCancelRefType = () => {
    setIsAddingRefType(false);
    setEditingRefType(null);
    setRefTypeForm({
      name: '',
      slug: '',
      description: '',
      prompt_template: '',
      max_images_allowed: 5,
      is_enabled: true,
    });
  };

  // ============= RENDER =============

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Product AI Lab Settings</h2>
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
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <SettingsIcon size={16} className="inline mr-1.5" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('reference-types')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'reference-types'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Layers size={16} className="inline mr-1.5" />
            Reference Types
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <>
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
                      <Sparkles size={16} className="text-primary-600" />
                      Model Version
                    </label>
                    <input
                      type="text"
                      value={settings.model_version || ''}
                      onChange={e => setSettings({ ...settings, model_version: e.target.value })}
                      placeholder="e.g., google/nano-banana-2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Specify the model version used for generating images</p>
                  </div>

                  {/* Prepend Prompt */}
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

                  {/* API Parameters */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <SettingsIcon size={16} className="text-primary-600" />
                      API Parameters
                    </h3>
                    <div className="space-y-4 pl-6">
                      {/* Resolution */}
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

                      {/* Aspect Ratio */}
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

                      {/* Output Format */}
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

                  {/* Features */}
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
              )}
            </>
          )}

          {/* Reference Types Tab */}
          {activeTab === 'reference-types' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Reference Types</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total: {totalMaxImages}/14 image slots used</p>
                </div>
                {!isAddingRefType && (
                  <button
                    onClick={() => setIsAddingRefType(true)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Add Reference Type
                  </button>
                )}
              </div>

              {/* Add/Edit Form */}
              {isAddingRefType && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                      <input
                        type="text"
                        value={refTypeForm.name}
                        onChange={e => setRefTypeForm({ ...refTypeForm, name: e.target.value })}
                        placeholder="e.g., Face Reference"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                      <input
                        type="text"
                        value={refTypeForm.slug}
                        onChange={e => setRefTypeForm({ ...refTypeForm, slug: e.target.value })}
                        placeholder="face_ref"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <input
                      type="text"
                      value={refTypeForm.description}
                      onChange={e => setRefTypeForm({ ...refTypeForm, description: e.target.value })}
                      placeholder="Optional description"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt Template</label>
                    <textarea
                      value={refTypeForm.prompt_template}
                      onChange={e => setRefTypeForm({ ...refTypeForm, prompt_template: e.target.value })}
                      placeholder="e.g., Face reference: {prompt}"
                      rows={2}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Images</label>
                      <input
                        type="range"
                        min="1"
                        max={Math.min(14, 14 - (totalMaxImages - (editingRefType?.max_images_allowed || 0)))}
                        value={refTypeForm.max_images_allowed}
                        onChange={e => setRefTypeForm({ ...refTypeForm, max_images_allowed: parseInt(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{refTypeForm.max_images_allowed} images</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={refTypeForm.is_enabled}
                        onChange={e => setRefTypeForm({ ...refTypeForm, is_enabled: e.target.checked })}
                        className="w-4 h-4 accent-primary-600 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Enabled</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRefType}
                      disabled={saving}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-700 text-white rounded transition disabled:opacity-50"
                    >
                      {editingRefType ? 'Update' : 'Create'}
                    </button>
                    <button
                      onClick={handleCancelRefType}
                      disabled={saving}
                      className="flex-1 px-2 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Reference Types List */}
              {referenceTypes.length > 0 && !isAddingRefType && (
                <div className="space-y-2">
                  {referenceTypes.map((refType) => (
                    <div key={refType.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">{refType.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{refType.max_images_allowed} images max</div>
                        {refType.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{refType.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!refType.is_enabled && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded">
                            Disabled
                          </span>
                        )}
                        <button
                          onClick={() => handleEditRefType(refType)}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition"
                        >
                          <Edit2 size={14} className="text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteRefType(refType.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition"
                        >
                          <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {referenceTypes.length === 0 && !isAddingRefType && (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No reference types defined yet</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Settings Tab Only */}
        {activeTab === 'settings' && hasLoadedOnce && (
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
