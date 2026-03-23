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
     * - default_aspect_ratio
     * - default_output_format (jpg, png)
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
            $supportedFields = $configDefaults['supported_fields'] ?? [];

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

            // Resolution credits
            if ($request->has('resolution_credits') && is_array($request->input('resolution_credits'))) {
                $credits = $request->input('resolution_credits');
                $resolution_credits = [];

                foreach (['1K', '2K', '4K'] as $res) {
                    if (isset($credits[$res])) {
                        $val = (int) $credits[$res];
                        if ($val < 0) {
                            return response()->json([
                                'message' => "Resolution credits for {$res} must be non-negative.",
                            ], 422);
                        }
                        $resolution_credits[$res] = $val;
                    }
                }

                if (!empty($resolution_credits)) {
                    $oldCredits = $oldSettings['resolution_credits'] ?? [];
                    if ($resolution_credits !== $oldCredits) {
                        $changes['resolution_credits'] = [
                            'old' => $oldCredits,
                            'new' => $resolution_credits,
                        ];
                        $updates['resolution_credits'] = $resolution_credits;
                    }
                }
            }

            // Enabled aspect ratios (array of values or objects with value/label)
            if ($request->has('enabled_aspect_ratios') && is_array($request->input('enabled_aspect_ratios'))) {
                $aspectRatios = $request->input('enabled_aspect_ratios');
                $enabledAspectRatios = [];

                foreach ($aspectRatios as $ar) {
                    if (is_string($ar)) {
                        $enabledAspectRatios[] = ['value' => $ar, 'label' => $ar];
                    } elseif (is_array($ar) && isset($ar['value'])) {
                        $enabledAspectRatios[] = [
                            'value' => (string) $ar['value'],
                            'label' => (string) ($ar['label'] ?? $ar['value']),
                        ];
                    }
                }

                if (!empty($enabledAspectRatios)) {
                    $oldAspectRatios = $oldSettings['enabled_aspect_ratios'] ?? [];
                    if ($enabledAspectRatios !== $oldAspectRatios) {
                        $changes['enabled_aspect_ratios'] = [
                            'old' => $oldAspectRatios,
                            'new' => $enabledAspectRatios,
                        ];
                        $updates['enabled_aspect_ratios'] = $enabledAspectRatios;
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
                SiteSetting::KEY_MAGIC_ERASER_DEFAULT_ASPECT_RATIO,
                SiteSetting::KEY_MAGIC_ERASER_DEFAULT_OUTPUT_FORMAT,
                SiteSetting::KEY_MAGIC_ERASER_RESOLUTION_1K_CREDITS,
                SiteSetting::KEY_MAGIC_ERASER_RESOLUTION_2K_CREDITS,
                SiteSetting::KEY_MAGIC_ERASER_RESOLUTION_4K_CREDITS,
                SiteSetting::KEY_MAGIC_ERASER_ENABLED_ASPECT_RATIOS,
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
