<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendMagicEraserSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MagicEraserSettingsController extends Controller
{
    /**
     * Get current Magic Eraser settings.
     *
     * Query parameter:
     * - format=minimal : Returns only settings (not config) for reduced payload
     */
    public function show(Request $request)
    {
        $settings = SiteSetting::getMagicEraserSettings();

        // Return minimal format if requested (for performance optimization)
        if ($request->query('format') === 'minimal') {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        $configDefaults = config('ai_studio_tools.magic_eraser', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Magic Eraser settings.
     *
     * Accepts partial updates:
     * - model_version (required)
     * - prepend_prompt
     * - default_resolution (1K, 2K, 4K)
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
            $oldSettings = SiteSetting::getMagicEraserSettings();
            $configDefaults = config('ai_studio_tools.magic_eraser', []);

            $updates = [];
            $changes = [];

            // Model version
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
                SiteSetting::setMagicEraserSettings($updates);

                Log::channel('admin')->info('Magic Eraser settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin
                SendMagicEraserSettingsSecurityEmailJob::dispatch($admin, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getMagicEraserSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Magic Eraser settings update failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to update settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset to config defaults.
     */
    public function reset(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getMagicEraserSettings();

            // Clear all Magic Eraser settings from database
            $keys = [
                SiteSetting::KEY_MAGIC_ERASER_MODEL_VERSION,
                SiteSetting::KEY_MAGIC_ERASER_PREPEND_PROMPT,
                SiteSetting::KEY_MAGIC_ERASER_DEFAULT_RESOLUTION,
                SiteSetting::KEY_MAGIC_ERASER_DEFAULT_OUTPUT_FORMAT,
                SiteSetting::KEY_MAGIC_ERASER_FEATURES_ENABLED,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getMagicEraserSettings();

            Log::channel('admin')->info('Magic Eraser settings reset to config defaults', [
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
                SendMagicEraserSettingsSecurityEmailJob::dispatch($admin, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Magic Eraser settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
