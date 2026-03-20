<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAILabReferenceType extends Model
{
    protected $table = 'product_ai_lab_reference_types';

    protected $fillable = [
        'slug',
        'name',
        'description',
        'prompt_template',
        'max_images_allowed',
        'order_position',
        'is_enabled',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'max_images_allowed' => 'integer',
        'order_position' => 'integer',
        'is_enabled' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Scope: Get only enabled reference types
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }

    /**
     * Scope: Get reference types ordered by position
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_position', 'asc');
    }

    /**
     * Get total max images across all reference types
     */
    public static function getTotalMaxImages(): int
    {
        return static::sum('max_images_allowed') ?? 0;
    }

    /**
     * Validate that a reference type can be added/updated
     * without exceeding the 14-image limit
     */
    public static function canAddImages(int $newMaxImages, ?int $excludeId = null): bool
    {
        $query = static::query();

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $currentTotal = $query->sum('max_images_allowed') ?? 0;
        return ($currentTotal + $newMaxImages) <= 14;
    }

    /**
     * Get remaining images allowed (max 14 minus current total)
     */
    public static function getRemainingImages(?int $excludeId = null): int
    {
        $query = static::query();

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        $currentTotal = $query->sum('max_images_allowed') ?? 0;
        return max(0, 14 - $currentTotal);
    }

    /**
     * Generate slug from name
     */
    public static function generateSlug(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9_]/', '_', $slug);
        $slug = preg_replace('/_+/', '_', $slug);
        return trim($slug, '_');
    }

    /**
     * Check if slug is unique (excluding current ID if editing)
     */
    public static function isSlugUnique(string $slug, ?int $excludeId = null): bool
    {
        $query = static::where('slug', $slug);

        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return !$query->exists();
    }
}
