import React, { useState, useEffect, useRef } from 'react';
import { X, Save, RotateCcw, Loader, Wand2, Info } from 'lucide-react';
import axios from 'axios';

export default function EnhancerSettingsModal({ isOpen, onClose, onSave }) {
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
      const response = await axios.get('/admin/enhancer-settings?format=minimal');
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
      await axios.put('/admin/enhancer-settings', settings);
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
      const response = await axios.post('/admin/enhancer-settings/reset');
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wand2 size={24} className="text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Image Enhancer Settings</h2>
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
                  <div className="group relative">
                    <Info size={16} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      The version hash of the Recraft Crisp Upscale model from Replicate
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  value={settings.model_version || ''}
                  onChange={e => setSettings({ ...settings, model_version: e.target.value })}
                  placeholder="e.g., recraft-ai/recraft-crisp-upscale"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recraft Crisp Upscale model version for image upscaling</p>
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
