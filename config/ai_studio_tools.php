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
            'model_name' => 'Nano Banana 2 (Google Gemini)',
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
        'universal_generate' => [
            'label' => 'Product AI Lab (VTO)',
            'model_name' => 'Nano Banana 2 (Google Gemini)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.067,
        ],
    ],

    /** Tool keys used in snapshots and ImageGeneration (order for UI). */
    'tool_order' => [
        'universal_generate',
        'magic_eraser',
        'background_remover',
        'compressor',
        'upscaler',
        'enhance',
        'lighting',
    ],

    /*
    |--------------------------------------------------------------------------
    | Nano Banana 2 (google/nano-banana-2) Configuration & Governance
    |--------------------------------------------------------------------------
    */
    'nano_banana' => [
        // Model version (hash) – can be updated by admin
        'model_version' => 'google/nano-banana-2:71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd',

        // Supported and validated input field values
        'supported_fields' => [
            'aspect_ratio' => ['match_input_image', '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4:1', '4:3', '4:5', '5:4', '8:1', '9:16', '16:9', '21:9'],
            'resolution' => ['1K', '2K', '4K'],
            'output_format' => ['jpg', 'png'],
            'seed' => ['min' => 0, 'max' => 2147483647], // uint32
        ],

        // Admin-configured defaults for global behavior
        'defaults' => [
            'aspect_ratio' => 'match_input_image',
            'resolution' => '1K',
            'output_format' => 'jpg',
            'seed' => null, // null means randomized each run
        ],

        // Cost guardrails: USD per image by resolution (with extra modifiers)
        'cost_per_resolution' => [
            '1K' => 0.067,
            '2K' => 0.101,
            '4K' => 0.151,
        ],
        'cost_multiplier_with_search' => 1.5, // 50% markup if google_search or image_search enabled

        // Feature toggles: admin can enable/disable expensive features
        'features' => [
            'google_search' => ['enabled' => false, 'cost_modifier' => 1.5],
            'image_search' => ['enabled' => false, 'cost_modifier' => 1.5],
            'seed_reproducibility' => ['enabled' => true], // Allow seed parameter
        ],

        // Preset quality/cost profiles for easy admin configuration
        'presets' => [
            'balanced' => [
                'label' => 'Balanced (Recommended)',
                'resolution' => '1K',
                'output_format' => 'jpg',
                'guidance_scale' => 7.5,
                'num_inference_steps' => 28,
                'google_search' => false,
                'image_search' => false,
            ],
            'quality' => [
                'label' => 'Quality (Higher Cost)',
                'resolution' => '2K',
                'output_format' => 'png',
                'guidance_scale' => 8.0,
                'num_inference_steps' => 40,
                'google_search' => false,
                'image_search' => false,
            ],
            'fast' => [
                'label' => 'Fast (Lower Cost)',
                'resolution' => '1K',
                'output_format' => 'jpg',
                'guidance_scale' => 7.0,
                'num_inference_steps' => 18,
                'google_search' => false,
                'image_search' => false,
            ],
        ],

        // Retry and resilience settings
        'retry' => [
            'max_attempts' => 3,
            'backoff_strategy' => 'exponential', // exponential(2,4,8) or linear(1,2,3)
            'timeout_seconds' => 65,
        ],
    ],
];
