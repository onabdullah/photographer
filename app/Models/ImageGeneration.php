<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ImageGeneration extends Model
{
    protected $fillable = [
        'shop_domain',
        'tool_used',
        'api_job_id',
        'original_image_url',
        'result_image_url',
        'shopify_product_id',
        'status',
        'error_message',
        'processing_time_seconds',
    ];

    protected function casts(): array
    {
        return [
            'processing_time_seconds' => 'decimal:4',
        ];
    }
}
