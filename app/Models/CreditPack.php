<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CreditPack extends Model
{
    protected $fillable = [
        'credits',
        'price',
        'per_credit_cost',
        'is_popular',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'credits' => 'integer',
        'price' => 'decimal:2',
        'per_credit_cost' => 'decimal:4',
        'is_popular' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Get only active credit packs, sorted by sort_order
     */
    public static function active()
    {
        return static::where('is_active', true)->orderBy('sort_order')->get();
    }

    /**
     * Format price as string with currency symbol
     */
    public function getFormattedPriceAttribute()
    {
        return '$' . number_format($this->price, 2);
    }

    /**
     * Calculate per credit cost in cents
     */
    public function getPerCreditCentsAttribute()
    {
        if ($this->credits > 0) {
            return round(($this->price / $this->credits) * 100, 1);
        }
        return 0;
    }
}

