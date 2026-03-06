<?php

namespace App\Models;

use Osiset\ShopifyApp\Storage\Models\Plan as ShopifyPlan;

class Plan extends ShopifyPlan
{
    // Extend the fillable array from the parent or redefine it
    // Since we don't know the exact content of the parent's fillable, we'll just add to it or redefine common ones + our new one.
    // However, usually it's safer to just redundant list them if we want to be sure, or merge in constructor.
    // For simplicity and to ensure our field is writable:

    public function __construct(array $attributes = [])
    {
        $this->mergeFillable(['monthly_credits']);
        parent::__construct($attributes);
    }
}
