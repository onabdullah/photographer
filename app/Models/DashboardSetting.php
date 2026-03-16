<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DashboardSetting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value', 'group'];

    // Hero Section Keys
    public const KEY_HERO_TITLE = 'hero_title';
    public const KEY_HERO_SUBTITLE = 'hero_subtitle';
    public const KEY_HERO_IMAGE_URL = 'hero_image_url';

    // Featured Tools Keys
    public const KEY_FEATURED_TOOLS_ENABLED = 'featured_tools_enabled';
    public const KEY_FEATURED_TOOLS = 'featured_tools';

    // Announcements Keys
    public const KEY_ANNOUNCEMENT_ENABLED = 'announcement_enabled';
    public const KEY_ANNOUNCEMENT_TEXT = 'announcement_text';

    /**
     * Get a setting value by key with caching.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $val = \Illuminate\Support\Facades\Cache::rememberForever("dashboard_setting_{$key}", function () use ($key) {
            $row = static::find($key);
            return $row ? $row->value : null;
        });

        return $val ?? $default;
    }

    /**
     * Set a setting value and invalidate cache.
     */
    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
        \Illuminate\Support\Facades\Cache::forget("dashboard_setting_{$key}");
    }

    /**
     * Get all settings in a specific group.
     */
    public static function getGroup(string $group): array
    {
        return static::where('group', $group)
            ->get(['key', 'value'])
            ->mapWithKeys(fn ($row) => [$row->key => $row->value])
            ->toArray();
    }

    /**
     * Get all dashboard settings as an array.
     */
    public static function getAll(): array
    {
        return static::all(['key', 'value'])
            ->mapWithKeys(fn ($row) => [$row->key => $row->value])
            ->toArray();
    }

    /**
     * Get hero settings.
     */
    public static function getHeroSettings(): array
    {
        return [
            'title' => static::get(self::KEY_HERO_TITLE, 'Welcome to Your AI Studio'),
            'subtitle' => static::get(self::KEY_HERO_SUBTITLE, 'Our AI photographer works for you — create stunning product photos that sell.'),
            'imageUrl' => static::get(self::KEY_HERO_IMAGE_URL, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80'),
        ];
    }

    /**
     * Set hero settings.
     */
    public static function setHeroSettings(array $settings): void
    {
        if (isset($settings['title'])) {
            static::set(self::KEY_HERO_TITLE, $settings['title']);
        }
        if (isset($settings['subtitle'])) {
            static::set(self::KEY_HERO_SUBTITLE, $settings['subtitle']);
        }
        if (isset($settings['imageUrl'])) {
            static::set(self::KEY_HERO_IMAGE_URL, $settings['imageUrl']);
        }
    }

    /**
     * Get featured tools settings.
     */
    public static function getFeaturedToolsSettings(): array
    {
        return [
            'enabled' => static::getBoolean(self::KEY_FEATURED_TOOLS_ENABLED, true),
            'tools' => json_decode(static::get(self::KEY_FEATURED_TOOLS, '[]'), true) ?: [],
        ];
    }

    /**
     * Set featured tools settings.
     */
    public static function setFeaturedToolsSettings(array $settings): void
    {
        if (isset($settings['enabled'])) {
            static::set(self::KEY_FEATURED_TOOLS_ENABLED, static::asBoolString($settings['enabled']));
        }
        if (isset($settings['tools'])) {
            static::set(self::KEY_FEATURED_TOOLS, json_encode($settings['tools']));
        }
    }

    /**
     * Get announcement settings.
     */
    public static function getAnnouncementSettings(): array
    {
        return [
            'enabled' => static::getBoolean(self::KEY_ANNOUNCEMENT_ENABLED, false),
            'text' => static::get(self::KEY_ANNOUNCEMENT_TEXT, ''),
        ];
    }

    /**
     * Set announcement settings.
     */
    public static function setAnnouncementSettings(array $settings): void
    {
        if (isset($settings['enabled'])) {
            static::set(self::KEY_ANNOUNCEMENT_ENABLED, static::asBoolString($settings['enabled']));
        }
        if (isset($settings['text'])) {
            static::set(self::KEY_ANNOUNCEMENT_TEXT, $settings['text']);
        }
    }

    /**
     * Reset all settings to defaults.
     */
    public static function resetToDefaults(): void
    {
        static::setHeroSettings([
            'title' => 'Welcome to Your AI Studio',
            'subtitle' => 'Our AI photographer works for you — create stunning product photos that sell. No shoots, no hassle.',
            'imageUrl' => 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
        ]);

        static::setFeaturedToolsSettings([
            'enabled' => true,
            'tools' => ['magic_eraser', 'remove_bg'],
        ]);

        static::setAnnouncementSettings([
            'enabled' => false,
            'text' => '',
        ]);
    }

    /**
     * Parse boolean value from string.
     */
    private static function getBoolean(string $key, bool $default): bool
    {
        $value = static::get($key);

        if ($value === null) {
            return $default;
        }

        return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Convert boolean to string for storage.
     */
    private static function asBoolString(bool $value): string
    {
        return $value ? '1' : '0';
    }
}
