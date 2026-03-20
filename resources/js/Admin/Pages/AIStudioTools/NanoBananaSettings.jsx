import React, { useState, useEffect } from 'react';
import {
  Card,
  BlockStack,
  Box,
  Text,
  TextField,
  Select,
  Checkbox,
  Button,
  Divider,
  InlineStack,
  Spinner,
  Banner,
  Layout,
} from '@shopify/polaris';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
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
      showToast('Failed to load settings', true);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, isError = false) => {
    setToast({ message: msg, isError });
    setTimeout(() => setToast(null), 3000);
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
      showToast('Settings saved successfully');
      fetchSettings(); // Refresh
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to config defaults?')) return;
    try {
      setSaving(true);
      await axios.post('/admin/nano-banana-settings/reset');
      showToast('Settings reset to defaults');
      fetchSettings();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset settings', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" padding="400">
        <Spinner />
      </Box>
    );
  }

  if (!settings) {
    return <Banner title="Error" tone="critical">Failed to load settings</Banner>;
  }

  const costPerRes = config?.cost_per_resolution || {};
  const costMult = config?.cost_multiplier_with_search || 1.5;

  return (
    <Layout>
      <Layout.Section>
        {toast && (
          <Box marginBottom="400">
            <Banner
              title={toast.isError ? 'Error' : 'Success'}
              tone={toast.isError ? 'critical' : 'success'}
            >
              {toast.message}
            </Banner>
          </Box>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">Nano Banana 2 Configuration</Text>
            <Text tone="subdued">
              Configure how the Nano Banana 2 model behaves. All changes apply instantly to new generations.
            </Text>

            <Divider />

            {/* Defaults Section */}
            <Box>
              <Text as="h3" variant="headingMd">Defaults</Text>
              <BlockStack gap="300" paddingBlockStart="300">
                <Select
                  label="Default Aspect Ratio"
                  options={ASPECT_RATIOS.map(ar => ({ label: ar, value: ar }))}
                  value={formData.default_aspect_ratio || 'match_input_image'}
                  onChange={val => handleInputChange('default_aspect_ratio', val)}
                />
                <Select
                  label="Default Resolution"
                  options={RESOLUTIONS.map(r => ({ label: r, value: r }))}
                  value={formData.default_resolution || '1K'}
                  onChange={val => handleInputChange('default_resolution', val)}
                />
                <Select
                  label="Default Output Format"
                  options={OUTPUT_FORMATS.map(f => ({ label: f, value: f }))}
                  value={formData.default_output_format || 'jpg'}
                  onChange={val => handleInputChange('default_output_format', val)}
                />
              </BlockStack>
            </Box>

            <Divider />

            {/* Feature Flags */}
            <Box>
              <Text as="h3" variant="headingMd">Feature Flags</Text>
              <BlockStack gap="200" paddingBlockStart="300">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.features_enabled?.google_search || false}
                    onChange={e => handleFeatureToggle('google_search', e.target.checked)}
                  />
                  <span>
                    <strong>Google Search Grounding</strong>
                    <br />
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      Use real-time web search to ground generations (+50% API cost)
                    </span>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.features_enabled?.image_search || false}
                    onChange={e => handleFeatureToggle('image_search', e.target.checked)}
                  />
                  <span>
                    <strong>Image Search Grounding</strong>
                    <br />
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      Use web image search to ground generations (+50% API cost)
                    </span>
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.features_enabled?.seed_reproducibility !== false}
                    onChange={e => handleFeatureToggle('seed_reproducibility', e.target.checked)}
                  />
                  <span>
                    <strong>Seed Reproducibility</strong>
                    <br />
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      Allow users to specify seed for reproducible results
                    </span>
                  </span>
                </label>
              </BlockStack>
            </Box>

            <Divider />

            {/* Cost Guardrails */}
            <Box>
              <Text as="h3" variant="headingMd">Cost Guardrails</Text>
              <BlockStack gap="300" paddingBlockStart="300">
                <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                  <Text variant="bodySm">Pricing per Generation:</Text>
                  <Text variant="bodySm">
                    1K: ${costPerRes['1K']?.toFixed(3)},
                    2K: ${costPerRes['2K']?.toFixed(3)},
                    4K: ${costPerRes['4K']?.toFixed(3)}
                  </Text>
                  {(formData.features_enabled?.google_search || formData.features_enabled?.image_search) && (
                    <Text variant="bodySm" tone="warning">
                      Search enabled: costs × {costMult}
                    </Text>
                  )}
                </Box>
                <TextField
                  label="Max Cost Per Generation (USD)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={String(formData.cost_guardrails?.max_cost_usd || '')}
                  onChange={val => handleCostGuardrailChange('max_cost_usd', val ? parseFloat(val) : undefined)}
                  placeholder="e.g., 0.50 (leave empty for no limit)"
                  helpText="Prevent generations exceeding this cost threshold"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.cost_guardrails?.allow_google_search !== false}
                    onChange={e => handleCostGuardrailChange('allow_google_search', e.target.checked)}
                  />
                  <span>Allow Google Search Grounding</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.cost_guardrails?.allow_image_search !== false}
                    onChange={e => handleCostGuardrailChange('allow_image_search', e.target.checked)}
                  />
                  <span>Allow Image Search Grounding</span>
                </label>
              </BlockStack>
            </Box>

            <Divider />

            {/* Advanced Config */}
            <Box>
              <Text as="h3" variant="headingMd">Advanced Parameters</Text>
              <BlockStack gap="300" paddingBlockStart="300">
                <TextField
                  label="Guidance Scale"
                  type="number"
                  step="0.1"
                  min="0"
                  max="20"
                  value={String(formData.advanced_config?.guidance_scale || '')}
                  onChange={val => handleAdvancedChange('guidance_scale', val ? parseFloat(val) : undefined)}
                  placeholder="0.0 - 20.0 (leave empty for Replicate default)"
                  helpText="Higher = more adherence to prompt. Leave empty for Replicate default."
                />
                <TextField
                  label="Num Inference Steps"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={String(formData.advanced_config?.num_inference_steps || '')}
                  onChange={val => handleAdvancedChange('num_inference_steps', val ? parseInt(val, 10) : undefined)}
                  placeholder="1 - 100 (leave empty for Replicate default)"
                  helpText="More steps = better quality but slower. Leave empty for Replicate default."
                />
              </BlockStack>
            </Box>

            <Divider />

            {/* Prompt Template */}
            <Box>
              <Text as="h3" variant="headingMd">Prompt Template (Optional)</Text>
              <BlockStack gap="300" paddingBlockStart="300">
                <TextField
                  label="Prepend to User Prompts"
                  value={formData.prompt_template || ''}
                  onChange={val => handleInputChange('prompt_template', val)}
                  placeholder="e.g., 'Always use professional photography lighting. Keep colors vibrant and true to life.'"
                  multiline={3}
                  helpText="This text is prepended to all user prompts. Leave empty for no template."
                />
              </BlockStack>
            </Box>

            <Divider />

            {/* Actions */}
            <InlineStack gap="200">
              <Button primary onClick={handleSave} loading={saving} disabled={loading || saving}>
                Save Settings
              </Button>
              <Button onClick={handleReset} disabled={loading || saving}>
                Reset to Defaults
              </Button>
            </InlineStack>

            <Box paddingBlockStart="200">
              <Text variant="bodySm" tone="subdued">
                Last updated: {settings.updated_at ? new Date(settings.updated_at).toLocaleString() : 'N/A'}
              </Text>
            </Box>
          </BlockStack>
        </Card>
      </Layout.Section>

      <Layout.Section variant="oneThird">
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">About Nano Banana 2</Text>
            <Text variant="bodySm" tone="subdued">
              Google's Gemini-powered model on Replicate. Supports multimodal input (product + reference images for style, face, pose matching).
            </Text>
            <Text variant="bodySm" tone="subdued">
              Model Version:<br />
              <code style={{ fontSize: 10, wordBreak: 'break-all' }}>
                {config?.model_version}
              </code>
            </Text>
            <Text variant="bodySm" tone="subdued">
              Supports up to 14 images per request. Reference images help guide the model.
            </Text>
          </BlockStack>
        </Card>
      </Layout.Section>
    </Layout>
  );
}
