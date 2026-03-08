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
}
