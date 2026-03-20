<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NanoBananaSettingsController extends Controller
{
    /**
     * Get current Nano Banana 2 settings (merged: config + DB).
     */
    public function show()
    {
        $settings = SiteSetting::getNanoBananaSettings();
        $configDefaults = config('ai_studio_tools.nano_banana', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Nano Banana 2 settings.
     *
     * Accepts partial updates:
     * - default_aspect_ratio, default_resolution, default_output_format
     * - prompt_template
     * - features_enabled: { google_search, image_search, seed_reproducibility }
     * - cost_guardrails: { enabled_resolutions, allow_google_search, allow_image_search, max_cost_usd }
     * - advanced_config: { guidance_scale, num_inference_steps }
     */
    public function update(Request $request)
    {
        try {
            $configDefaults = config('ai_studio_tools.nano_banana', []);
            $supportedFields = $configDefaults['supported_fields'] ?? [];

            // Validate and update each field
            $updates = [];

            // Default aspect ratio
            if ($request->filled('default_aspect_ratio')) {
                $aspect = $request->input('default_aspect_ratio');
                if (in_array($aspect, $supportedFields['aspect_ratio'] ?? [], true)) {
                    $updates['default_aspect_ratio'] = $aspect;
                } else {
                    return response()->json([
                        'message' => 'Invalid aspect ratio. Supported: ' . implode(', ', $supportedFields['aspect_ratio'] ?? []),
                    ], 422);
                }
            }

            // Default resolution
            if ($request->filled('default_resolution')) {
                $res = strtoupper($request->input('default_resolution'));
                if (in_array($res, $supportedFields['resolution'] ?? [], true)) {
                    $updates['default_resolution'] = $res;
                } else {
                    return response()->json([
                        'message' => 'Invalid resolution. Supported: ' . implode(', ', $supportedFields['resolution'] ?? []),
                    ], 422);
                }
            }

            // Default output format
            if ($request->filled('default_output_format')) {
                $fmt = strtolower($request->input('default_output_format'));
                if (in_array($fmt, $supportedFields['output_format'] ?? [], true)) {
                    $updates['default_output_format'] = $fmt;
                } else {
                    return response()->json([
                        'message' => 'Invalid output format. Supported: ' . implode(', ', $supportedFields['output_format'] ?? []),
                    ], 422);
                }
            }

            // Prompt template
            if ($request->has('prompt_template')) {
                $updates['prompt_template'] = trim((string) $request->input('prompt_template', ''));
            }

            // Feature flags
            if ($request->has('features_enabled') && is_array($request->input('features_enabled'))) {
                $features = $request->input('features_enabled');
                $features_enabled = [];

                if (isset($features['google_search'])) {
                    $features_enabled['google_search'] = (bool) $features['google_search'];
                }
                if (isset($features['image_search'])) {
                    $features_enabled['image_search'] = (bool) $features['image_search'];
                }
                if (isset($features['seed_reproducibility'])) {
                    $features_enabled['seed_reproducibility'] = (bool) $features['seed_reproducibility'];
                }

                if (! empty($features_enabled)) {
                    $updates['features_enabled'] = $features_enabled;
                }
            }

            // Cost guardrails
            if ($request->has('cost_guardrails') && is_array($request->input('cost_guardrails'))) {
                $guardrails = $request->input('cost_guardrails');
                $cost_guardrails = [];

                if (isset($guardrails['enabled_resolutions'])) {
                    $enabled = (array) $guardrails['enabled_resolutions'];
                    $enabled = array_filter($enabled, fn ($r) => in_array(strtoupper((string) $r), $supportedFields['resolution'] ?? [], true));
                    $enabled = array_map(fn ($r) => strtoupper((string) $r), $enabled);
                    if (! empty($enabled)) {
                        $cost_guardrails['enabled_resolutions'] = array_values($enabled);
                    }
                }
                if (isset($guardrails['allow_google_search'])) {
                    $cost_guardrails['allow_google_search'] = (bool) $guardrails['allow_google_search'];
                }
                if (isset($guardrails['allow_image_search'])) {
                    $cost_guardrails['allow_image_search'] = (bool) $guardrails['allow_image_search'];
                }
                if (isset($guardrails['max_cost_usd'])) {
                    $max = (float) $guardrails['max_cost_usd'];
                    if ($max >= 0) {
                        $cost_guardrails['max_cost_usd'] = $max;
                    }
                }

                if (! empty($cost_guardrails)) {
                    $updates['cost_guardrails'] = $cost_guardrails;
                }
            }

            // Advanced config
            if ($request->has('advanced_config') && is_array($request->input('advanced_config'))) {
                $advanced = $request->input('advanced_config');
                $advanced_config = [];

                if (isset($advanced['guidance_scale'])) {
                    $val = (float) $advanced['guidance_scale'];
                    $min = 0.0;
                    $max = 20.0;
                    if ($val >= $min && $val <= $max) {
                        $advanced_config['guidance_scale'] = $val;
                    }
                }
                if (isset($advanced['num_inference_steps'])) {
                    $val = (int) $advanced['num_inference_steps'];
                    $min = 1;
                    $max = 100;
                    if ($val >= $min && $val <= $max) {
                        $advanced_config['num_inference_steps'] = $val;
                    }
                }

                if (! empty($advanced_config)) {
                    $updates['advanced_config'] = $advanced_config;
                }
            }

            // Save all updates
            if (! empty($updates)) {
                SiteSetting::setNanoBananaSettings($updates);
                Log::channel('admin')->info('Nano Banana 2 settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $request->user('admin')?->email ?? 'unknown',
                ]);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getNanoBananaSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Nano Banana 2 settings update failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to update settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset to config defaults (clear DB overrides).
     */
    public function reset()
    {
        try {
            // Clear all Nano Banana settings from database
            $keys = [
                'nano_banana_model_version',
                'nano_banana_default_aspect_ratio',
                'nano_banana_default_resolution',
                'nano_banana_default_output_format',
                'nano_banana_prompt_template',
                'nano_banana_cost_guardrails',
                'nano_banana_advanced_config',
                'nano_banana_features_enabled',
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            Log::channel('admin')->info('Nano Banana 2 settings reset to config defaults', [
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => SiteSetting::getNanoBananaSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Nano Banana 2 settings reset failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
