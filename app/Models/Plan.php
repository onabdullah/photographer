<?php

namespace App\Models;

use Osiset\ShopifyApp\Storage\Models\Plan as ShopifyPlan;

class Plan extends ShopifyPlan
{
    /**
     * The attributes that are mass assignable.
     *
     * Explicitly declare all fillable fields to ensure plan updates work correctly.
     * This overrides the parent's fillable array.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'type',
        'price',
        'trial_days',
        'monthly_credits',
        'on_install',
        'test',
        'capped_amount',
        'terms',
    ];
}
