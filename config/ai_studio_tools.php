<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Studio tool display names and model metadata (for admin reports).
    | Keys must match ImageGeneration.tool_used and AppStat suffix names.
    |--------------------------------------------------------------------------
    */
    /*
    | Estimated USD per image (for admin display). Replicate: typical run cost; Built-in: 0.
    */
    'tools' => [
        'background_remover' => [
            'label' => 'Background Remover',
            'model_name' => 'BiRefNet (men1scus/birefnet)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.0023,
        ],
        'magic_eraser' => [
            'label' => 'Magic Eraser',
            'model_name' => 'Google Nano Banana 2 (Gemini 3.1 Flash Image)',
            'model_provider' => 'Replicate',
            // Nano Banana 2: 1K $0.067, 2K $0.101, 4K $0.151 per image (Replicate pricing)
            'estimated_rate_per_image_usd' => 0.067,
        ],
        'compressor' => [
            'label' => 'Image Compressor',
            'model_name' => 'PHP GD (built-in)',
            'model_provider' => 'Built-in',
            'estimated_rate_per_image_usd' => 0,
        ],
        'upscaler' => [
            'label' => 'Upscaler',
            'model_name' => 'Real-ESRGAN (nightmareai/real-esrgan)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.0023,
        ],
        'enhance' => [
            'label' => 'Image Enhancer',
            'model_name' => 'GFPGAN (tencentarc/gfpgan)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.0023,
        ],
        'lighting' => [
            'label' => 'Lighting Fix',
            'model_name' => 'IC-Light (zsxkib/ic-light)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.0025,
        ],
    ],

    /** Tool keys used in snapshots and ImageGeneration (order for UI). */
    'tool_order' => [
        'magic_eraser',
        'background_remover',
        'compressor',
        'upscaler',
        'enhance',
        'lighting',
    ],
];
