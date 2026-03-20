import React, { useState, useEffect } from 'react';
import { X, Save, Loader, AlertCircle, Eye, Plus, Edit2, Trash2 } from 'lucide-react';
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

export default function ModelSettingsModal({ isOpen, onClose, modelKey, modelName, currentSettings, onSave }) {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({});
  const [activeTab, setActiveTab] = useState('config');
  const [referenceCategories, setReferenceCategories] = useState([]);
  const [showRefForm, setShowRefForm] = useState(false);
  const [editingRef, setEditingRef] = useState(null);
  const [refForm, setRefForm] = useState({ name: '', description: '', prepend_prompt: '', enabled: true });

  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
      // Load reference categories from settings
      const refs = currentSettings.reference_categories || [];
      setReferenceCategories(refs);
    }
  }, [currentSettings, isOpen]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.put('/admin/nano-banana-settings', settings);
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const costPerRes = {
    '1K': 0.067,
    '2K': 0.101,
    '4K': 0.151,
  };
  const costMult = 1.5;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{modelName} Settings</h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'config'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('visibility')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'visibility'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            User Visibility
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Defaults */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Defaults</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Default Aspect Ratio
                    </label>
                    <select
                      value={settings.default_aspect_ratio || 'match_input_image'}
                      onChange={e => setSettings({...settings, default_aspect_ratio: e.target.value})}
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
                      value={settings.default_resolution || '1K'}
                      onChange={e => setSettings({...settings, default_resolution: e.target.value})}
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
                      value={settings.default_output_format || 'jpg'}
                      onChange={e => setSettings({...settings, default_output_format: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {OUTPUT_FORMATS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Feature Flags */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features_enabled?.google_search || false}
                      onChange={e => setSettings({
                        ...settings,
                        features_enabled: {...settings.features_enabled, google_search: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Google Search Grounding</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">+50% API cost</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features_enabled?.image_search || false}
                      onChange={e => setSettings({
                        ...settings,
                        features_enabled: {...settings.features_enabled, image_search: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Image Search Grounding</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">+50% API cost</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features_enabled?.seed_reproducibility !== false}
                      onChange={e => setSettings({
                        ...settings,
                        features_enabled: {...settings.features_enabled, seed_reproducibility: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Seed Reproducibility</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Allow reproducible results</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Advanced Config */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Advanced Parameters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Guidance Scale (0.0 - 20.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={settings.advanced_config?.guidance_scale || ''}
                      onChange={e => setSettings({
                        ...settings,
                        advanced_config: {...settings.advanced_config, guidance_scale: e.target.value ? parseFloat(e.target.value) : undefined}
                      })}
                      placeholder="Leave empty for default"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inference Steps (1 - 100)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="100"
                      value={settings.advanced_config?.num_inference_steps || ''}
                      onChange={e => setSettings({
                        ...settings,
                        advanced_config: {...settings.advanced_config, num_inference_steps: e.target.value ? parseInt(e.target.value, 10) : undefined}
                      })}
                      placeholder="Leave empty for default"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Prompt Template */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Prompt Template</h3>
                <textarea
                  value={settings.prompt_template || ''}
                  onChange={e => setSettings({...settings, prompt_template: e.target.value})}
                  placeholder="Text prepended to all user prompts"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="space-y-6">
              {/* What Users See */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Control what options are visible to users on the Shopify app. Changes apply immediately.
                  </div>
                </div>
              </div>

              {/* Aspect Ratios */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye size={16} />
                  Visible Aspect Ratios
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Select which aspect ratios users can choose from
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map(ar => (
                    <label key={ar} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!settings.cost_guardrails?.enabled_resolutions ||
                                 settings.cost_guardrails?.enabled_resolutions?.length === 0 ||
                                 true}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{ar}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resolutions */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye size={16} />
                  Visible Resolutions
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Select which resolutions users can choose from
                </p>
                <div className="space-y-2">
                  {RESOLUTIONS.map(res => (
                    <label key={res} className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <input
                        type="checkbox"
                        checked={!settings.cost_guardrails?.enabled_resolutions ||
                                 settings.cost_guardrails?.enabled_resolutions?.includes(res) ||
                                 true}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{res}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ${costPerRes[res]?.toFixed(3)} {settings.features_enabled?.google_search || settings.features_enabled?.image_search ? `• ×${costMult} with search` : ''}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Features to Show */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye size={16} />
                  Feature Visibility
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Choose which features users can access
                </p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={settings.cost_guardrails?.allow_google_search !== false}
                      onChange={e => setSettings({
                        ...settings,
                        cost_guardrails: {...settings.cost_guardrails, allow_google_search: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Google Search Grounding</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Allow users to enable web search</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <input
                      type="checkbox"
                      checked={settings.cost_guardrails?.allow_image_search !== false}
                      onChange={e => setSettings({
                        ...settings,
                        cost_guardrails: {...settings.cost_guardrails, allow_image_search: e.target.checked}
                      })}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Image Search Grounding</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Allow users to enable image search</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
