<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * NanoBananaSetting – Persistent storage for google/nano-banana-2 configuration.
 *
 * Structured model for admin-managed Nano Banana settings including:
 * - Model version and feature toggles
 * - Default resolutions, formats, and aspect ratios
 * - Advanced parameters (guidance_scale, num_inference_steps)
 * - Cost guardrails and feature availability
 * - Prompt template for system-level instruction wrapping
 *
 * Admin uses this through SiteSetting getters/setters which cache in Redis.
 * This model provides structured access and validation layers.
 */
class NanoBananaSetting extends Model
{
    protected $table = 'nano_banana_tool_settings';

    protected $fillable = [
        'setting_key',
        'setting_value',
        'data_type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get a setting by key, with optional default.
     */
    public static function getValue(string $key, ?string $default = null): ?string
    {
        $setting = static::where('setting_key', $key)->first();
        return $setting?->setting_value ?? $default;
    }

    /**
     * Get all settings grouped by category for admin display.
     */
    public static function allGrouped(): array
    {
        return [
            'model' => [
                'model_version' => static::getValue('model_version', config('ai_studio_tools.nano_banana.model_version')),
            ],
            'defaults' => [
                'resolution' => static::getValue('default_resolution', 'match_input_image'),
                'aspect_ratio' => static::getValue('default_aspect_ratio', '1:1'),
                'output_format' => static::getValue('default_output_format', 'jpg'),
            ],
            'features' => [
                'google_search_enabled' => (bool) static::getValue('google_search_enabled', '0'),
                'image_search_enabled' => (bool) static::getValue('image_search_enabled', '0'),
                'seed_reproducibility_enabled' => (bool) static::getValue('seed_reproducibility_enabled', '1'),
            ],
            'advanced' => [
                'guidance_scale' => (float) static::getValue('guidance_scale', '7.5'),
                'num_inference_steps' => (int) static::getValue('num_inference_steps', '28'),
            ],
        ];
    }

    /**
     * Update or create a setting.
     */
    public static function setSetting(string $key, string $value, string $dataType = 'string'): static
    {
        return static::updateOrCreate(
            ['setting_key' => $key],
            [
                'setting_value' => $value,
                'data_type' => $dataType,
                'is_active' => true,
            ]
        );
    }

    /**
     * Enable/disable a boolean feature toggle.
     */
    public static function toggleFeature(string $featureKey, bool $enabled): static
    {
        return static::setSetting($featureKey, $enabled ? '1' : '0', 'boolean');
    }
}
