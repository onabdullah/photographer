<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendProductAILabSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProductAILabSettingsController extends Controller
{
    /**
     * Get current Product AI Lab settings (merged: config + DB).
     */
    public function show()
    {
        $settings = SiteSetting::getProductAILabSettings();
        $configDefaults = config('ai_studio_tools.product_ai_lab', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Product AI Lab settings.
     *
     * Accepts partial updates:
     * - model_version (required)
     * - prepend_prompt
     * - default_resolution (1K, 2K, 4K)
     * - default_aspect_ratio
     * - default_output_format (jpg, png)
     * - features_enabled: { google_search, image_search }
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getProductAILabSettings();
            $configDefaults = config('ai_studio_tools.product_ai_lab', []);
            $supportedFields = $configDefaults['supported_fields'] ?? [];

            $updates = [];
            $changes = [];

            // Model version (required for identification, but update is optional)
            if ($request->filled('model_version')) {
                $modelVersion = trim((string) $request->input('model_version'));
                if ($modelVersion !== $oldSettings['model_version']) {
                    $changes['model_version'] = [
                        'old' => $oldSettings['model_version'],
                        'new' => $modelVersion,
                    ];
                    $updates['model_version'] = $modelVersion;
                }
            }

            // Prepend prompt
            if ($request->has('prepend_prompt')) {
                $prompt = trim((string) $request->input('prepend_prompt', ''));
                if (strlen($prompt) > 2000) {
                    return response()->json([
                        'message' => 'Prepend prompt must not exceed 2000 characters.',
                    ], 422);
                }
                if ($prompt !== $oldSettings['prepend_prompt']) {
                    $changes['prepend_prompt'] = [
                        'old' => $oldSettings['prepend_prompt'],
                        'new' => $prompt,
                    ];
                    $updates['prepend_prompt'] = $prompt;
                }
            }

            // Default resolution
            if ($request->filled('default_resolution')) {
                $res = strtoupper($request->input('default_resolution'));
                if (in_array($res, ['1K', '2K', '4K'], true)) {
                    if ($res !== $oldSettings['default_resolution']) {
                        $changes['default_resolution'] = [
                            'old' => $oldSettings['default_resolution'],
                            'new' => $res,
                        ];
                        $updates['default_resolution'] = $res;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid resolution. Supported: 1K, 2K, 4K',
                    ], 422);
                }
            }

            // Default aspect ratio
            if ($request->filled('default_aspect_ratio')) {
                $aspect = $request->input('default_aspect_ratio');
                if (in_array($aspect, $supportedFields['aspect_ratio'] ?? [], true)) {
                    if ($aspect !== $oldSettings['default_aspect_ratio']) {
                        $changes['default_aspect_ratio'] = [
                            'old' => $oldSettings['default_aspect_ratio'],
                            'new' => $aspect,
                        ];
                        $updates['default_aspect_ratio'] = $aspect;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid aspect ratio. Supported: ' . implode(', ', $supportedFields['aspect_ratio'] ?? []),
                    ], 422);
                }
            }

            // Default output format
            if ($request->filled('default_output_format')) {
                $fmt = strtolower($request->input('default_output_format'));
                if (in_array($fmt, ['jpg', 'png'], true)) {
                    if ($fmt !== $oldSettings['default_output_format']) {
                        $changes['default_output_format'] = [
                            'old' => $oldSettings['default_output_format'],
                            'new' => $fmt,
                        ];
                        $updates['default_output_format'] = $fmt;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid output format. Supported: jpg, png',
                    ], 422);
                }
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

                if (!empty($features_enabled)) {
                    $oldFeatures = $oldSettings['features_enabled'] ?? [];
                    if ($features_enabled !== $oldFeatures) {
                        $changes['features_enabled'] = [
                            'old' => $oldFeatures,
                            'new' => $features_enabled,
                        ];
                        $updates['features_enabled'] = $features_enabled;
                    }
                }
            }

            // Save all updates if there are changes
            if (!empty($updates)) {
                SiteSetting::setProductAILabSettings($updates);

                Log::channel('admin')->info('Product AI Lab settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin
                SendProductAILabSettingsSecurityEmailJob::dispatch($admin, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getProductAILabSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Product AI Lab settings update failed', [
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
    public function reset(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getProductAILabSettings();

            // Clear all Product AI Lab settings from database
            $keys = [
                SiteSetting::KEY_PRODUCT_AI_LAB_MODEL_VERSION,
                SiteSetting::KEY_PRODUCT_AI_LAB_PREPEND_PROMPT,
                SiteSetting::KEY_PRODUCT_AI_LAB_DEFAULT_RESOLUTION,
                SiteSetting::KEY_PRODUCT_AI_LAB_DEFAULT_ASPECT_RATIO,
                SiteSetting::KEY_PRODUCT_AI_LAB_DEFAULT_OUTPUT_FORMAT,
                SiteSetting::KEY_PRODUCT_AI_LAB_FEATURES_ENABLED,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getProductAILabSettings();

            Log::channel('admin')->info('Product AI Lab settings reset to config defaults', [
                'admin' => $admin->email,
            ]);

            // Dispatch security email showing reset
            $changes = [];
            foreach (array_keys($oldSettings) as $field) {
                if ($oldSettings[$field] !== $newSettings[$field]) {
                    $changes[$field] = [
                        'old' => $oldSettings[$field],
                        'new' => $newSettings[$field],
                    ];
                }
            }

            if (!empty($changes)) {
                SendProductAILabSettingsSecurityEmailJob::dispatch($admin, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Product AI Lab settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
