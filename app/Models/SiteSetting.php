<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class SiteSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    public const KEY_APP_NAME = 'app_name';

    public const KEY_APP_LOGO = 'app_logo';

    public const KEY_FOOTER_TEXT = 'footer_text';

    public const KEY_SOCIAL_LINKS = 'social_links'; // JSON: { facebook?, twitter?, instagram?, linkedin?, youtube? }

    public const KEY_PASSWORD_EXPIRY_DAYS = 'password_expiry_days'; // 0 = no expiry

    public const KEY_CHAT_REALTIME_ENABLED = 'chat_realtime_enabled';
    public const KEY_CHAT_AUTO_FALLBACK = 'chat_auto_fallback_enabled';
    public const KEY_CHAT_MANUAL_REFRESH_INTERVAL_SECONDS = 'chat_manual_refresh_interval_seconds';
    public const KEY_CHAT_AUTO_RETURN_REALTIME = 'chat_auto_return_realtime';
    public const KEY_CHAT_FALLBACK_THRESHOLD_SECONDS = 'chat_fallback_threshold_seconds';
    public const KEY_CHAT_RECOVERY_THRESHOLD_SECONDS = 'chat_recovery_threshold_seconds';
    public const KEY_CHAT_SHOW_STATUS_BADGE_AGENTS = 'chat_show_status_badge_agents';
    public const KEY_CHAT_SHOW_STATUS_BADGE_CUSTOMERS = 'chat_show_status_badge_customers';

    // Nano Banana 2 Configuration Keys
    public const KEY_NANO_BANANA_MODEL_VERSION = 'nano_banana_model_version';
    public const KEY_NANO_BANANA_DEFAULT_RESOLUTION = 'nano_banana_default_resolution';
    public const KEY_NANO_BANANA_DEFAULT_ASPECT_RATIO = 'nano_banana_default_aspect_ratio';
    public const KEY_NANO_BANANA_DEFAULT_OUTPUT_FORMAT = 'nano_banana_default_output_format';
    public const KEY_NANO_BANANA_PROMPT_TEMPLATE = 'nano_banana_prompt_template';
    public const KEY_NANO_BANANA_CURRENT_PRESET = 'nano_banana_current_preset';
    public const KEY_NANO_BANANA_ADVANCED_CONFIG = 'nano_banana_advanced_config'; // JSON: guid_scale, seed_policy, etc.
    public const KEY_NANO_BANANA_FEATURES_ENABLED = 'nano_banana_features_enabled'; // JSON: google_search, image_search
    public const KEY_NANO_BANANA_COST_GUARDRAILS = 'nano_banana_cost_guardrails'; // JSON: max_cost_usd, enabled_resolutions

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $val = \Illuminate\Support\Facades\Cache::rememberForever("site_setting_{$key}", function () use ($key) {
            $row = static::find($key);
            return $row ? $row->value : null;
        });
        
        return $val ?? $default;
    }

    /**
     * Set a setting value.
     */
    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
        \Illuminate\Support\Facades\Cache::forget("site_setting_{$key}");
    }

    /**
     * Get the public URL for the app logo, or null if not set.
     */
    public static function getAppLogoUrl(): ?string
    {
        $path = static::get(self::KEY_APP_LOGO);
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->exists($path) ? Storage::disk('public')->url($path) : null;
    }

    public static function getSocialLinks(): array
    {
        $raw = static::get(self::KEY_SOCIAL_LINKS);
        if (! $raw) {
            return [];
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    public static function setSocialLinks(array $links): void
    {
        static::set(self::KEY_SOCIAL_LINKS, json_encode($links));
    }

    public static function getPasswordExpiryDays(): int
    {
        $v = static::get(self::KEY_PASSWORD_EXPIRY_DAYS);
        return $v !== null && $v !== '' ? (int) $v : 0;
    }

    public static function getChatSyncSettings(): array
    {
        return [
            'realtime_enabled' => static::getBoolean(self::KEY_CHAT_REALTIME_ENABLED, true),
            'auto_fallback_enabled' => static::getBoolean(self::KEY_CHAT_AUTO_FALLBACK, true),
            'manual_refresh_interval_seconds' => static::getInt(self::KEY_CHAT_MANUAL_REFRESH_INTERVAL_SECONDS, 12),
            'auto_return_realtime' => static::getBoolean(self::KEY_CHAT_AUTO_RETURN_REALTIME, true),
            'fallback_threshold_seconds' => static::getInt(self::KEY_CHAT_FALLBACK_THRESHOLD_SECONDS, 20),
            'recovery_threshold_seconds' => static::getInt(self::KEY_CHAT_RECOVERY_THRESHOLD_SECONDS, 20),
            'show_status_badge_agents' => static::getBoolean(self::KEY_CHAT_SHOW_STATUS_BADGE_AGENTS, true),
            'show_status_badge_customers' => static::getBoolean(self::KEY_CHAT_SHOW_STATUS_BADGE_CUSTOMERS, true),
        ];
    }

    public static function setChatSyncSettings(array $settings): void
    {
        static::set(self::KEY_CHAT_REALTIME_ENABLED, static::asBoolString($settings['realtime_enabled'] ?? true));
        static::set(self::KEY_CHAT_AUTO_FALLBACK, static::asBoolString($settings['auto_fallback_enabled'] ?? true));
        static::set(self::KEY_CHAT_MANUAL_REFRESH_INTERVAL_SECONDS, (string) ($settings['manual_refresh_interval_seconds'] ?? 12));
        static::set(self::KEY_CHAT_AUTO_RETURN_REALTIME, static::asBoolString($settings['auto_return_realtime'] ?? true));
        static::set(self::KEY_CHAT_FALLBACK_THRESHOLD_SECONDS, (string) ($settings['fallback_threshold_seconds'] ?? 20));
        static::set(self::KEY_CHAT_RECOVERY_THRESHOLD_SECONDS, (string) ($settings['recovery_threshold_seconds'] ?? 20));
        static::set(self::KEY_CHAT_SHOW_STATUS_BADGE_AGENTS, static::asBoolString($settings['show_status_badge_agents'] ?? true));
        static::set(self::KEY_CHAT_SHOW_STATUS_BADGE_CUSTOMERS, static::asBoolString($settings['show_status_badge_customers'] ?? true));
    }

    private static function getBoolean(string $key, bool $default): bool
    {
        $value = static::get($key);

        if ($value === null) {
            return $default;
        }

        return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
    }

    private static function getInt(string $key, int $default): int
    {
        $value = static::get($key);

        if ($value === null || $value === '') {
            return $default;
        }

        return (int) $value;
    }

    private static function asBoolString(bool $value): string
    {
        return $value ? '1' : '0';
    }

    /**
     * Get complete Nano Banana 2 configuration (merged from config + SiteSetting overrides).
     * Provides fallback to config defaults if not yet customized in database.
     */
    public static function getNanoBananaSettings(): array
    {
        $configDefaults = config('ai_studio_tools.nano_banana', []);
        $rawFeatures = json_decode(static::get(self::KEY_NANO_BANANA_FEATURES_ENABLED, json_encode($configDefaults['features'] ?? [])), true) ?: [];
        $normalizeFeature = function (mixed $featureValue, bool $fallback): bool {
            if (is_array($featureValue)) {
                return (bool) ($featureValue['enabled'] ?? $fallback);
            }
            if ($featureValue === null) {
                return $fallback;
            }
            return (bool) $featureValue;
        };
        $normalizedFeatures = [
            'google_search' => $normalizeFeature($rawFeatures['google_search'] ?? null, (bool) (($configDefaults['features']['google_search']['enabled'] ?? false))),
            'image_search' => $normalizeFeature($rawFeatures['image_search'] ?? null, (bool) (($configDefaults['features']['image_search']['enabled'] ?? false))),
            'seed_reproducibility' => $normalizeFeature($rawFeatures['seed_reproducibility'] ?? null, (bool) (($configDefaults['features']['seed_reproducibility']['enabled'] ?? true))),
        ];
        
        return [
            'model_version' => static::get(self::KEY_NANO_BANANA_MODEL_VERSION, $configDefaults['model_version'] ?? ''),
            'default_resolution' => static::get(self::KEY_NANO_BANANA_DEFAULT_RESOLUTION, $configDefaults['defaults']['resolution'] ?? '1K'),
            'default_aspect_ratio' => static::get(self::KEY_NANO_BANANA_DEFAULT_ASPECT_RATIO, $configDefaults['defaults']['aspect_ratio'] ?? 'match_input_image'),
            'default_output_format' => static::get(self::KEY_NANO_BANANA_DEFAULT_OUTPUT_FORMAT, $configDefaults['defaults']['output_format'] ?? 'jpg'),
            'prompt_template' => static::get(self::KEY_NANO_BANANA_PROMPT_TEMPLATE, ''),
            'current_preset' => static::get(self::KEY_NANO_BANANA_CURRENT_PRESET, 'balanced'),
            'advanced_config' => json_decode(static::get(self::KEY_NANO_BANANA_ADVANCED_CONFIG, '{}'), true) ?: [],
            'features_enabled' => $normalizedFeatures,
            'cost_guardrails' => json_decode(static::get(self::KEY_NANO_BANANA_COST_GUARDRAILS, '{}'), true) ?: [],
        ];
    }

    /** Update multiple Nano Banana settings at once. */
    public static function setNanoBananaSettings(array $settings): void
    {
        if (isset($settings['model_version'])) {
            static::set(self::KEY_NANO_BANANA_MODEL_VERSION, $settings['model_version']);
        }
        if (isset($settings['default_resolution'])) {
            static::set(self::KEY_NANO_BANANA_DEFAULT_RESOLUTION, $settings['default_resolution']);
        }
        if (isset($settings['default_aspect_ratio'])) {
            static::set(self::KEY_NANO_BANANA_DEFAULT_ASPECT_RATIO, $settings['default_aspect_ratio']);
        }
        if (isset($settings['default_output_format'])) {
            static::set(self::KEY_NANO_BANANA_DEFAULT_OUTPUT_FORMAT, $settings['default_output_format']);
        }
        if (isset($settings['prompt_template'])) {
            static::set(self::KEY_NANO_BANANA_PROMPT_TEMPLATE, $settings['prompt_template']);
        }
        if (isset($settings['current_preset'])) {
            static::set(self::KEY_NANO_BANANA_CURRENT_PRESET, $settings['current_preset']);
        }
        if (isset($settings['advanced_config'])) {
            static::set(self::KEY_NANO_BANANA_ADVANCED_CONFIG, json_encode($settings['advanced_config']));
        }
        if (isset($settings['features_enabled'])) {
            static::set(self::KEY_NANO_BANANA_FEATURES_ENABLED, json_encode($settings['features_enabled']));
        }
        if (isset($settings['cost_guardrails'])) {
            static::set(self::KEY_NANO_BANANA_COST_GUARDRAILS, json_encode($settings['cost_guardrails']));
        }
    }

    /** Get a specific Nano Banana preset by name. */
    public static function getNanoBananaPreset(string $presetName): ?array
    {
        $presets = config('ai_studio_tools.nano_banana.presets', []);
        return $presets[$presetName] ?? null;
    }

    /** Apply a preset and save it as current. */
    public static function applyNanoBananaPreset(string $presetName): bool
    {
        $preset = static::getNanoBananaPreset($presetName);
        if (!$preset) {
            return false;
        }
        static::set(self::KEY_NANO_BANANA_CURRENT_PRESET, $presetName);
        // Optionally sync preset values to individual settings
        return true;
    }
}
