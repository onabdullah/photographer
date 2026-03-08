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

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, ?string $default = null): ?string
    {
        $row = static::find($key);

        return $row ? $row->value : $default;
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
}
