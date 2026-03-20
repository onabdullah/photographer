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

    /**
     * Get Nano Banana 2 settings (merged: config defaults + DB overrides).
     *
     * Allows admin to override config via database without deploys.
     * Fallback chain: DB → config → hardcoded defaults
     */
    public static function getNanoBananaSettings(): array
    {
        $configDefaults = config('ai_studio_tools.nano_banana', []);

        // Database keys for Nano Banana settings
        $dbSettings = [
            'model_version' => static::get('nano_banana_model_version'),
            'default_aspect_ratio' => static::get('nano_banana_default_aspect_ratio'),
            'default_resolution' => static::get('nano_banana_default_resolution'),
            'default_output_format' => static::get('nano_banana_default_output_format'),
            'prompt_template' => static::get('nano_banana_prompt_template'),
            'cost_guardrails' => static::getJson('nano_banana_cost_guardrails'),
            'advanced_config' => static::getJson('nano_banana_advanced_config'),
            'features_enabled' => static::getJson('nano_banana_features_enabled'),
        ];

        // Normalize feature flags: merge DB-backed toggles with config
        $normalizeFeature = function (mixed $dbValue, mixed $configValue, bool $fallback): bool {
            // Explicit DB override takes precedence
            if ($dbValue !== null) {
                if (is_array($dbValue)) {
                    return (bool) ($dbValue['enabled'] ?? $fallback);
                }
                return (bool) $dbValue;
            }
            // Fall back to config
            if ($configValue !== null) {
                if (is_array($configValue)) {
                    return (bool) ($configValue['enabled'] ?? $fallback);
                }
                return (bool) $configValue;
            }
            return $fallback;
        };

        $configFeatures = $configDefaults['features'] ?? [];
        $dbFeatures = $dbSettings['features_enabled'] ?? [];
        $configDefaults_defaults = $configDefaults['defaults'] ?? [];

        return [
            'model_version' => (string) ($dbSettings['model_version'] ?: ($configDefaults['model_version'] ?? '')),
            'default_resolution' => (string) ($dbSettings['default_resolution'] ?: ($configDefaults_defaults['resolution'] ?? '1K')),
            'default_aspect_ratio' => (string) ($dbSettings['default_aspect_ratio'] ?: ($configDefaults_defaults['aspect_ratio'] ?? 'match_input_image')),
            'default_output_format' => (string) ($dbSettings['default_output_format'] ?: ($configDefaults_defaults['output_format'] ?? 'jpg')),
            'prompt_template' => trim((string) ($dbSettings['prompt_template'] ?? '')),
            'advanced_config' => is_array($dbSettings['advanced_config'] ?? null) ? $dbSettings['advanced_config'] : ($configDefaults['advanced_config'] ?? []),
            'supported_fields' => $configDefaults['supported_fields'] ?? [],
            'cost_per_resolution' => $configDefaults['cost_per_resolution'] ?? [],
            'cost_multiplier_with_search' => (float) ($configDefaults['cost_multiplier_with_search'] ?? 1.5),
            'retry' => $configDefaults['retry'] ?? ['max_attempts' => 3, 'timeout_seconds' => 65, 'backoff_strategy' => 'exponential'],
            'cost_guardrails' => is_array($dbSettings['cost_guardrails'] ?? null) ? $dbSettings['cost_guardrails'] : [],
            'features_enabled' => [
                'google_search' => $normalizeFeature(
                    $dbFeatures['google_search'] ?? null,
                    $configFeatures['google_search'] ?? null,
                    false
                ),
                'image_search' => $normalizeFeature(
                    $dbFeatures['image_search'] ?? null,
                    $configFeatures['image_search'] ?? null,
                    false
                ),
                'seed_reproducibility' => $normalizeFeature(
                    $dbFeatures['seed_reproducibility'] ?? null,
                    $configFeatures['seed_reproducibility'] ?? null,
                    true
                ),
            ],
        ];
    }

    /**
     * Set Nano Banana 2 settings (store in database).
     *
     * @param array $settings Keys: model_version, default_aspect_ratio, default_resolution,
     *                        default_output_format, prompt_template, cost_guardrails,
     *                        advanced_config, features_enabled
     */
    public static function setNanoBananaSettings(array $settings): void
    {
        if (isset($settings['model_version'])) {
            static::set('nano_banana_model_version', (string) $settings['model_version']);
        }
        if (isset($settings['default_aspect_ratio'])) {
            static::set('nano_banana_default_aspect_ratio', (string) $settings['default_aspect_ratio']);
        }
        if (isset($settings['default_resolution'])) {
            static::set('nano_banana_default_resolution', (string) $settings['default_resolution']);
        }
        if (isset($settings['default_output_format'])) {
            static::set('nano_banana_default_output_format', (string) $settings['default_output_format']);
        }
        if (isset($settings['prompt_template'])) {
            static::set('nano_banana_prompt_template', (string) $settings['prompt_template']);
        }
        if (isset($settings['cost_guardrails']) && is_array($settings['cost_guardrails'])) {
            static::setJson('nano_banana_cost_guardrails', $settings['cost_guardrails']);
        }
        if (isset($settings['advanced_config']) && is_array($settings['advanced_config'])) {
            static::setJson('nano_banana_advanced_config', $settings['advanced_config']);
        }
        if (isset($settings['features_enabled']) && is_array($settings['features_enabled'])) {
            static::setJson('nano_banana_features_enabled', $settings['features_enabled']);
        }
    }

    /**
     * Get a JSON-encoded setting value.
     */
    private static function getJson(string $key): ?array
    {
        $raw = static::get($key);
        if (! $raw) {
            return null;
        }
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Set a JSON-encoded setting value.
     */
    private static function setJson(string $key, array $value): void
    {
        static::set($key, json_encode($value));
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
}
