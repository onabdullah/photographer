<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Studio tool display names and model metadata (for admin reports).
    | Keys must match ImageGeneration.tool_used and AppStat suffix names.
    |--------------------------------------------------------------------------
    */
    'tools' => [
        'background_remover' => [
            'label' => 'Background Remover',
            'model_name' => 'BiRefNet (men1scus/birefnet)',
            'model_provider' => 'Replicate',
        ],
        'magic_eraser' => [
            'label' => 'Magic Eraser',
            'model_name' => 'Google Nano Banana 2 (Gemini 3.1 Flash Image)',
            'model_provider' => 'Replicate',
        ],
        'compressor' => [
            'label' => 'Image Compressor',
            'model_name' => 'PHP GD (built-in)',
            'model_provider' => 'Built-in',
        ],
        'upscaler' => [
            'label' => 'Upscaler',
            'model_name' => 'Real-ESRGAN (nightmareai/real-esrgan)',
            'model_provider' => 'Replicate',
        ],
        'enhance' => [
            'label' => 'Image Enhancer',
            'model_name' => 'GFPGAN (tencentarc/gfpgan)',
            'model_provider' => 'Replicate',
        ],
        'lighting' => [
            'label' => 'Lighting Fix',
            'model_name' => 'IC-Light (zsxkib/ic-light)',
            'model_provider' => 'Replicate',
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
