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
