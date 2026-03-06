<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_id',
        'original_image_url',
        'generated_image_url',
        'prompt_used',
        'status',
    ];

    public function merchant()
    {
        return $this->belongsTo(Merchant::class);
    }
}
