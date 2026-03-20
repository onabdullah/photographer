<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendBackgroundRemoverSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BackgroundRemoverSettingsController extends Controller
{
    /**
     * Get current Background Remover settings.
     *
     * Query parameter:
     * - format=minimal : Returns only settings (not config) for reduced payload
     */
    public function show(Request $request)
    {
        $settings = SiteSetting::getBackgroundRemoverSettings();

        // Return minimal format if requested (for performance optimization)
        if ($request->query('format') === 'minimal') {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        $configDefaults = config('ai_studio_tools.background_remover', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Background Remover settings.
     *
     * Accepts partial updates:
     * - model_version (required)
     * - default_resolution (optional, format: WxH or empty)
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getBackgroundRemoverSettings();

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

            // Default resolution
            if ($request->has('default_resolution')) {
                $res = trim((string) $request->input('default_resolution', ''));
                if ($res !== $oldSettings['default_resolution']) {
                    $changes['default_resolution'] = [
                        'old' => $oldSettings['default_resolution'],
                        'new' => $res,
                    ];
                    $updates['default_resolution'] = $res;
                }
            }

            // Save all updates if there are changes
            if (!empty($updates)) {
                SiteSetting::setBackgroundRemoverSettings($updates);

                Log::channel('admin')->info('Background Remover settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin
                SendBackgroundRemoverSettingsSecurityEmailJob::dispatch($admin, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getBackgroundRemoverSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Background Remover settings update failed', [
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
            $oldSettings = SiteSetting::getBackgroundRemoverSettings();

            // Clear all Background Remover settings from database
            $keys = [
                SiteSetting::KEY_BACKGROUND_REMOVER_MODEL_VERSION,
                SiteSetting::KEY_BACKGROUND_REMOVER_DEFAULT_RESOLUTION,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getBackgroundRemoverSettings();

            Log::channel('admin')->info('Background Remover settings reset to config defaults', [
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
                SendBackgroundRemoverSettingsSecurityEmailJob::dispatch($admin, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Background Remover settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
