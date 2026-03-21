<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendUpscalerSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UpscalerSettingsController extends Controller
{
    /**
     * Get current Upscaler settings (merged: config + DB).
     *
     * Query parameter:
     * - format=minimal : Returns only settings (not config) for reduced payload
     */
    public function show(Request $request)
    {
        $settings = SiteSetting::getUpscalerSettings();

        // Return minimal format if requested (for performance optimization)
        if ($request->query('format') === 'minimal') {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        $configDefaults = config('ai_studio_tools.upscaler', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Upscaler settings.
     *
     * Accepts partial updates:
     * - model_version (required)
     * - default_scale (1-10)
     * - default_face_enhance (boolean)
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getUpscalerSettings();
            $configDefaults = config('ai_studio_tools.upscaler', []);
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

            // Default scale (1-10)
            if ($request->filled('default_scale')) {
                $scale = (int) $request->input('default_scale');
                $min = $supportedFields['scale']['min'] ?? 1;
                $max = $supportedFields['scale']['max'] ?? 10;

                if ($scale < $min || $scale > $max) {
                    return response()->json([
                        'message' => "Scale must be between {$min} and {$max}",
                    ], 422);
                }

                if ($scale !== $oldSettings['default_scale']) {
                    $changes['default_scale'] = [
                        'old' => $oldSettings['default_scale'],
                        'new' => $scale,
                    ];
                    $updates['default_scale'] = $scale;
                }
            }

            // Default face enhance (boolean)
            if ($request->has('default_face_enhance')) {
                $faceEnhance = (bool) $request->input('default_face_enhance');
                if ($faceEnhance !== $oldSettings['default_face_enhance']) {
                    $changes['default_face_enhance'] = [
                        'old' => $oldSettings['default_face_enhance'],
                        'new' => $faceEnhance,
                    ];
                    $updates['default_face_enhance'] = $faceEnhance;
                }
            }

            // Save all updates if there are changes
            if (!empty($updates)) {
                SiteSetting::setUpscalerSettings($updates);

                Log::channel('admin')->info('Upscaler settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin (pass ID, not model)
                SendUpscalerSettingsSecurityEmailJob::dispatch($admin->id, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getUpscalerSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Upscaler settings update failed', [
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
            $oldSettings = SiteSetting::getUpscalerSettings();

            // Clear all Upscaler settings from database
            $keys = [
                SiteSetting::KEY_UPSCALER_MODEL_VERSION,
                SiteSetting::KEY_UPSCALER_DEFAULT_SCALE,
                SiteSetting::KEY_UPSCALER_DEFAULT_FACE_ENHANCE,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getUpscalerSettings();

            Log::channel('admin')->info('Upscaler settings reset to config defaults', [
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
                SendUpscalerSettingsSecurityEmailJob::dispatch($admin->id, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Upscaler settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
