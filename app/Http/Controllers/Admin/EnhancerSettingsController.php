<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendEnhancerSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EnhancerSettingsController extends Controller
{
    /**
     * Get current Image Enhancer settings (merged: config + DB).
     *
     * Query parameter:
     * - format=minimal : Returns only settings (not config) for reduced payload
     */
    public function show(Request $request)
    {
        $settings = SiteSetting::getEnhancerSettings();

        // Return minimal format if requested (for performance optimization)
        if ($request->query('format') === 'minimal') {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        $configDefaults = config('ai_studio_tools.enhance', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Image Enhancer settings.
     *
     * Accepts partial updates:
     * - model_version (required for identification, but update is optional)
     * - default_aspect_ratio
     * - default_resolution (1K, 2K, 4K)
     * - default_output_format (jpg, png)
     * - features_enabled (google_search, image_search toggles)
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getEnhancerSettings();
            $configDefaults = config('ai_studio_tools.enhance', []);
            $supportedFields = $configDefaults['supported_fields'] ?? [];

            $updates = [];
            $changes = [];

            // Model version (optional)
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

            // Default aspect ratio
            if ($request->filled('default_aspect_ratio')) {
                $aspectRatio = $request->input('default_aspect_ratio');
                if (in_array($aspectRatio, $supportedFields['aspect_ratio'] ?? [], true)) {
                    if ($aspectRatio !== $oldSettings['default_aspect_ratio']) {
                        $changes['default_aspect_ratio'] = [
                            'old' => $oldSettings['default_aspect_ratio'],
                            'new' => $aspectRatio,
                        ];
                        $updates['default_aspect_ratio'] = $aspectRatio;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid aspect ratio. Supported: ' . implode(', ', $supportedFields['aspect_ratio'] ?? []),
                    ], 422);
                }
            }

            // Default resolution
            if ($request->filled('default_resolution')) {
                $resolution = $request->input('default_resolution');
                if (in_array($resolution, $supportedFields['resolution'] ?? [], true)) {
                    if ($resolution !== $oldSettings['default_resolution']) {
                        $changes['default_resolution'] = [
                            'old' => $oldSettings['default_resolution'],
                            'new' => $resolution,
                        ];
                        $updates['default_resolution'] = $resolution;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid resolution. Supported: ' . implode(', ', $supportedFields['resolution'] ?? []),
                    ], 422);
                }
            }

            // Default output format
            if ($request->filled('default_output_format')) {
                $format = strtolower($request->input('default_output_format'));
                if (in_array($format, $supportedFields['output_format'] ?? [], true)) {
                    if ($format !== $oldSettings['default_output_format']) {
                        $changes['default_output_format'] = [
                            'old' => $oldSettings['default_output_format'],
                            'new' => $format,
                        ];
                        $updates['default_output_format'] = $format;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid output format. Supported: ' . implode(', ', $supportedFields['output_format'] ?? []),
                    ], 422);
                }
            }

            // Features (google_search, image_search)
            $newFeatures = [
                'google_search' => $request->has('features_enabled.google_search') ? (bool) $request->input('features_enabled.google_search') : ($oldSettings['features_enabled']['google_search'] ?? false),
                'image_search' => $request->has('features_enabled.image_search') ? (bool) $request->input('features_enabled.image_search') : ($oldSettings['features_enabled']['image_search'] ?? false),
            ];

            if ($newFeatures !== $oldSettings['features_enabled']) {
                $changes['features_enabled'] = [
                    'old' => $oldSettings['features_enabled'],
                    'new' => $newFeatures,
                ];
                $updates['features_enabled'] = $newFeatures;
            }

            // Save all updates if there are changes
            if (!empty($updates)) {
                SiteSetting::setEnhancerSettings($updates);

                Log::channel('admin')->info('Image Enhancer settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin (pass ID, not model)
                SendEnhancerSettingsSecurityEmailJob::dispatch($admin->id, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getEnhancerSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Image Enhancer settings update failed', [
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
            $oldSettings = SiteSetting::getEnhancerSettings();

            // Clear all Image Enhancer settings from database
            $keys = [
                SiteSetting::KEY_ENHANCER_MODEL_VERSION,
                SiteSetting::KEY_ENHANCER_DEFAULT_ASPECT_RATIO,
                SiteSetting::KEY_ENHANCER_DEFAULT_RESOLUTION,
                SiteSetting::KEY_ENHANCER_DEFAULT_OUTPUT_FORMAT,
                SiteSetting::KEY_ENHANCER_FEATURES_ENABLED,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getEnhancerSettings();

            Log::channel('admin')->info('Image Enhancer settings reset to config defaults', [
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
                SendEnhancerSettingsSecurityEmailJob::dispatch($admin->id, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Image Enhancer settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
