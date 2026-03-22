<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\SendLightingFixSettingsSecurityEmailJob;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class LightingFixSettingsController extends Controller
{
    /**
     * Get current Lighting Fix settings (merged: config + DB).
     *
     * Query parameter:
     * - format=minimal : Returns only settings (not config) for reduced payload
     */
    public function show(Request $request)
    {
        $settings = SiteSetting::getLightingFixSettings();

        // Return minimal format if requested (for performance optimization)
        if ($request->query('format') === 'minimal') {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        $configDefaults = config('ai_studio_tools.lighting_fix', []);

        return response()->json([
            'settings' => $settings,
            'config' => $configDefaults,
        ]);
    }

    /**
     * Update Lighting Fix settings.
     *
     * Accepts partial updates:
     * - model_version (required)
     * - appended_prompt
     * - negative_prompt
     * - default_light_source
     * - default_output_format (webp, jpg, png)
     * - default_width (256-1024)
     * - default_height (256-1024)
     * - default_cfg (1-32)
     * - default_steps (1-100)
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user('admin');
            if (!$admin) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get old settings for comparison
            $oldSettings = SiteSetting::getLightingFixSettings();
            $configDefaults = config('ai_studio_tools.lighting_fix', []);
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

            // Appended prompt
            if ($request->has('appended_prompt')) {
                $prompt = trim((string) $request->input('appended_prompt', ''));
                if (strlen($prompt) > 2000) {
                    return response()->json([
                        'message' => 'Appended prompt must not exceed 2000 characters.',
                    ], 422);
                }
                if ($prompt !== $oldSettings['appended_prompt']) {
                    $changes['appended_prompt'] = [
                        'old' => $oldSettings['appended_prompt'],
                        'new' => $prompt,
                    ];
                    $updates['appended_prompt'] = $prompt;
                }
            }

            // Negative prompt
            if ($request->has('negative_prompt')) {
                $prompt = trim((string) $request->input('negative_prompt', ''));
                if (strlen($prompt) > 2000) {
                    return response()->json([
                        'message' => 'Negative prompt must not exceed 2000 characters.',
                    ], 422);
                }
                if ($prompt !== $oldSettings['negative_prompt']) {
                    $changes['negative_prompt'] = [
                        'old' => $oldSettings['negative_prompt'],
                        'new' => $prompt,
                    ];
                    $updates['negative_prompt'] = $prompt;
                }
            }

            // Default light source
            if ($request->filled('default_light_source')) {
                $source = $request->input('default_light_source');
                if (in_array($source, $supportedFields['light_source'] ?? [], true)) {
                    if ($source !== $oldSettings['default_light_source']) {
                        $changes['default_light_source'] = [
                            'old' => $oldSettings['default_light_source'],
                            'new' => $source,
                        ];
                        $updates['default_light_source'] = $source;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid light source. Supported: ' . implode(', ', $supportedFields['light_source'] ?? []),
                    ], 422);
                }
            }

            // Default output format
            if ($request->filled('default_output_format')) {
                $fmt = strtolower($request->input('default_output_format'));
                if (in_array($fmt, $supportedFields['output_format'] ?? [], true)) {
                    if ($fmt !== $oldSettings['default_output_format']) {
                        $changes['default_output_format'] = [
                            'old' => $oldSettings['default_output_format'],
                            'new' => $fmt,
                        ];
                        $updates['default_output_format'] = $fmt;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid output format. Supported: ' . implode(', ', $supportedFields['output_format'] ?? []),
                    ], 422);
                }
            }

            // Default width
            if ($request->filled('default_width')) {
                $width = (int) $request->input('default_width');
                if (in_array($width, $supportedFields['width'] ?? [], true)) {
                    if ($width !== $oldSettings['default_width']) {
                        $changes['default_width'] = [
                            'old' => $oldSettings['default_width'],
                            'new' => $width,
                        ];
                        $updates['default_width'] = $width;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid width. Supported: ' . implode(', ', $supportedFields['width'] ?? []),
                    ], 422);
                }
            }

            // Default height
            if ($request->filled('default_height')) {
                $height = (int) $request->input('default_height');
                if (in_array($height, $supportedFields['height'] ?? [], true)) {
                    if ($height !== $oldSettings['default_height']) {
                        $changes['default_height'] = [
                            'old' => $oldSettings['default_height'],
                            'new' => $height,
                        ];
                        $updates['default_height'] = $height;
                    }
                } else {
                    return response()->json([
                        'message' => 'Invalid height. Supported: ' . implode(', ', $supportedFields['height'] ?? []),
                    ], 422);
                }
            }

            // Default CFG (Classifier-Free Guidance)
            if ($request->filled('default_cfg')) {
                $cfg = (float) $request->input('default_cfg');
                $cfgRange = $supportedFields['cfg'] ?? ['min' => 1, 'max' => 32];
                if ($cfg < $cfgRange['min'] || $cfg > $cfgRange['max']) {
                    return response()->json([
                        'message' => "CFG must be between {$cfgRange['min']} and {$cfgRange['max']}",
                    ], 422);
                }
                if ($cfg !== $oldSettings['default_cfg']) {
                    $changes['default_cfg'] = [
                        'old' => $oldSettings['default_cfg'],
                        'new' => $cfg,
                    ];
                    $updates['default_cfg'] = $cfg;
                }
            }

            // Default steps
            if ($request->filled('default_steps')) {
                $steps = (int) $request->input('default_steps');
                $stepsRange = $supportedFields['steps'] ?? ['min' => 1, 'max' => 100];
                if ($steps < $stepsRange['min'] || $steps > $stepsRange['max']) {
                    return response()->json([
                        'message' => "Steps must be between {$stepsRange['min']} and {$stepsRange['max']}",
                    ], 422);
                }
                if ($steps !== $oldSettings['default_steps']) {
                    $changes['default_steps'] = [
                        'old' => $oldSettings['default_steps'],
                        'new' => $steps,
                    ];
                    $updates['default_steps'] = $steps;
                }
            }

            // Default highres scale
            if ($request->filled('default_highres_scale')) {
                $scale = (float) $request->input('default_highres_scale');
                $scaleRange = $supportedFields['highres_scale'] ?? ['min' => 1, 'max' => 3];
                if ($scale < $scaleRange['min'] || $scale > $scaleRange['max']) {
                    return response()->json([
                        'message' => "Highres scale must be between {$scaleRange['min']} and {$scaleRange['max']}",
                    ], 422);
                }
                if ($scale !== $oldSettings['default_highres_scale']) {
                    $changes['default_highres_scale'] = [
                        'old' => $oldSettings['default_highres_scale'],
                        'new' => $scale,
                    ];
                    $updates['default_highres_scale'] = $scale;
                }
            }

            // Default lowres denoise
            if ($request->filled('default_lowres_denoise')) {
                $denoise = (float) $request->input('default_lowres_denoise');
                $denoiseRange = $supportedFields['lowres_denoise'] ?? ['min' => 0.1, 'max' => 1];
                if ($denoise < $denoiseRange['min'] || $denoise > $denoiseRange['max']) {
                    return response()->json([
                        'message' => "Lowres denoise must be between {$denoiseRange['min']} and {$denoiseRange['max']}",
                    ], 422);
                }
                if ($denoise !== $oldSettings['default_lowres_denoise']) {
                    $changes['default_lowres_denoise'] = [
                        'old' => $oldSettings['default_lowres_denoise'],
                        'new' => $denoise,
                    ];
                    $updates['default_lowres_denoise'] = $denoise;
                }
            }

            // Default highres denoise
            if ($request->filled('default_highres_denoise')) {
                $denoise = (float) $request->input('default_highres_denoise');
                $denoiseRange = $supportedFields['highres_denoise'] ?? ['min' => 0.1, 'max' => 1];
                if ($denoise < $denoiseRange['min'] || $denoise > $denoiseRange['max']) {
                    return response()->json([
                        'message' => "Highres denoise must be between {$denoiseRange['min']} and {$denoiseRange['max']}",
                    ], 422);
                }
                if ($denoise !== $oldSettings['default_highres_denoise']) {
                    $changes['default_highres_denoise'] = [
                        'old' => $oldSettings['default_highres_denoise'],
                        'new' => $denoise,
                    ];
                    $updates['default_highres_denoise'] = $denoise;
                }
            }

            // Default output quality
            if ($request->filled('default_output_quality')) {
                $quality = (int) $request->input('default_output_quality');
                $qualityRange = $supportedFields['output_quality'] ?? ['min' => 0, 'max' => 100];
                if ($quality < $qualityRange['min'] || $quality > $qualityRange['max']) {
                    return response()->json([
                        'message' => "Output quality must be between {$qualityRange['min']} and {$qualityRange['max']}",
                    ], 422);
                }
                if ($quality !== $oldSettings['default_output_quality']) {
                    $changes['default_output_quality'] = [
                        'old' => $oldSettings['default_output_quality'],
                        'new' => $quality,
                    ];
                    $updates['default_output_quality'] = $quality;
                }
            }

            // Default number of images
            if ($request->filled('default_number_of_images')) {
                $numImages = (int) $request->input('default_number_of_images');
                $imagesRange = $supportedFields['number_of_images'] ?? ['min' => 1, 'max' => 12];
                if ($numImages < $imagesRange['min'] || $numImages > $imagesRange['max']) {
                    return response()->json([
                        'message' => "Number of images must be between {$imagesRange['min']} and {$imagesRange['max']}",
                    ], 422);
                }
                if ($numImages !== $oldSettings['default_number_of_images']) {
                    $changes['default_number_of_images'] = [
                        'old' => $oldSettings['default_number_of_images'],
                        'new' => $numImages,
                    ];
                    $updates['default_number_of_images'] = $numImages;
                }
            }

            // Save all updates if there are changes
            if (!empty($updates)) {
                SiteSetting::setLightingFixSettings($updates);

                Log::channel('admin')->info('Lighting Fix settings updated', [
                    'updated_fields' => array_keys($updates),
                    'admin' => $admin->email,
                    'changes' => $changes,
                ]);

                // Dispatch security email job to super-admin (pass ID, not model)
                SendLightingFixSettingsSecurityEmailJob::dispatch($admin->id, $changes);
            }

            return response()->json([
                'message' => 'Settings updated successfully.',
                'settings' => SiteSetting::getLightingFixSettings(),
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Lighting Fix settings update failed', [
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
            $oldSettings = SiteSetting::getLightingFixSettings();

            // Clear all Lighting Fix settings from database
            $keys = [
                SiteSetting::KEY_LIGHTING_FIX_MODEL_VERSION,
                SiteSetting::KEY_LIGHTING_FIX_APPENDED_PROMPT,
                SiteSetting::KEY_LIGHTING_FIX_NEGATIVE_PROMPT,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_LIGHT_SOURCE,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_OUTPUT_FORMAT,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_WIDTH,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_HEIGHT,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_CFG,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_STEPS,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_HIGHRES_SCALE,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_LOWRES_DENOISE,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_HIGHRES_DENOISE,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_OUTPUT_QUALITY,
                SiteSetting::KEY_LIGHTING_FIX_DEFAULT_NUMBER_OF_IMAGES,
            ];

            foreach ($keys as $key) {
                SiteSetting::set($key, null);
            }

            // Get new (default) settings
            $newSettings = SiteSetting::getLightingFixSettings();

            Log::channel('admin')->info('Lighting Fix settings reset to config defaults', [
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
                SendLightingFixSettingsSecurityEmailJob::dispatch($admin->id, $changes, isReset: true);
            }

            return response()->json([
                'message' => 'Settings reset to defaults.',
                'settings' => $newSettings,
            ]);
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Lighting Fix settings reset failed', [
                'error' => $e->getMessage(),
                'admin' => $request->user('admin')?->email ?? 'unknown',
            ]);

            return response()->json([
                'message' => 'Failed to reset settings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
