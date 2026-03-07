<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiStudioToolSetting extends Model
{
    protected $fillable = ['tool_key', 'is_enabled'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    /** Tool key to store frontend value (for Select). */
    public const STORE_VALUE_MAP = [
        'magic_eraser' => 'magic_eraser',
        'background_remover' => 'remove_bg',
        'compressor' => 'compressor',
        'upscaler' => 'upscale',
        'enhance' => 'enhance',
        'lighting' => 'lighting',
    ];

    public static function enabledToolKeysOrdered(): array
    {
        $order = config('ai_studio_tools.tool_order', []);
        $settings = self::where('is_enabled', true)->pluck('tool_key')->toArray();
        return array_values(array_intersect($order, $settings));
    }

    /** Enabled tool values for the store frontend (Select options). */
    public static function enabledStoreValues(): array
    {
        try {
            if (self::count() === 0) {
                return self::defaultStoreValues();
            }
            $keys = self::enabledToolKeysOrdered();
            $values = [];
            foreach ($keys as $key) {
                if (isset(self::STORE_VALUE_MAP[$key])) {
                    $values[] = self::STORE_VALUE_MAP[$key];
                }
            }
            return $values;
        } catch (\Throwable $e) {
            return self::defaultStoreValues();
        }
    }

    private static function defaultStoreValues(): array
    {
        $order = config('ai_studio_tools.tool_order', []);
        $values = [];
        foreach ($order as $key) {
            if (isset(self::STORE_VALUE_MAP[$key])) {
                $values[] = self::STORE_VALUE_MAP[$key];
            }
        }
        return $values;
    }
}
