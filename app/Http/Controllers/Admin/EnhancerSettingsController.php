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
     * - model_version (optional)
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
