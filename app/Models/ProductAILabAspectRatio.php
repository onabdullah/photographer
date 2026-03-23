<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAILabAspectRatio extends Model
{
    protected $table = 'product_ai_lab_aspect_ratios';

    protected $fillable = [
        'value',
        'label',
        'order_position',
        'is_enabled',
        'is_default',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'is_default' => 'boolean',
    ];

    /**
     * Get all enabled aspect ratios, ordered.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Order by position.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_position');
    }

    /**
     * Get all enabled aspect ratios, ordered.
     */
    public static function getEnabled()
    {
        return self::enabled()->ordered()->get();
    }

    /**
     * Get the default aspect ratio, or first enabled if none set as default.
     */
    public static function getDefault()
    {
        return self::where('is_default', true)->first()
            ?? self::enabled()->ordered()->first();
    }
}
