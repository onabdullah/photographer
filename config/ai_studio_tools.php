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
    | Nano Banana 2 Configuration (Google Gemini multimodal model on Replicate)
    | Used by: AiUniversalService, AiGenerationService (Magic Eraser)
    | Model: google/nano-banana-2
    |--------------------------------------------------------------------------
    */
    'nano_banana' => [
        'model_version' => '71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd',

        'defaults' => [
            'aspect_ratio' => 'match_input_image',
            'resolution' => '1K',
            'output_format' => 'jpg',
        ],

        'supported_fields' => [
            'aspect_ratio' => [
                'match_input_image',
                '1:1',
                '1:4',
                '1:8',
                '2:3',
                '3:2',
                '3:4',
                '4:1',
                '4:3',
                '4:5',
                '5:4',
                '8:1',
                '9:16',
                '16:9',
                '21:9',
            ],
            'resolution' => ['1K', '2K', '4K'],
            'output_format' => ['jpg', 'png'],
            'seed' => [
                'min' => 0,
                'max' => 2147483647,
            ],
        ],

        // Replicate pricing (USD per prediction)
        'cost_per_resolution' => [
            '1K' => 0.067,
            '2K' => 0.101,
            '4K' => 0.151,
        ],

        // Cost multiplier when Google Search or Image Search grounding is enabled (+50%)
        'cost_multiplier_with_search' => 1.5,

        // Retry strategy for transient API errors (429, 5xx)
        'retry' => [
            'max_attempts' => 3,
            'timeout_seconds' => 65,
            'backoff_strategy' => 'exponential', // 'exponential' or 'linear'
        ],

        // Feature flags (can be overridden in database via SiteSetting)
        'features' => [
            'google_search' => [
                'enabled' => false,
                'label' => 'Google Search grounding',
                'description' => 'Use real-time web search to ground generations',
                'cost_note' => 'Increases API cost by 50%',
            ],
            'image_search' => [
                'enabled' => false,
                'label' => 'Image Search grounding',
                'description' => 'Use web image search to ground generations',
                'cost_note' => 'Increases API cost by 50%',
            ],
            'seed_reproducibility' => [
                'enabled' => true,
                'label' => 'Seed reproducibility',
                'description' => 'Allow users to specify seed for reproducible results',
            ],
        ],

        // Advanced inference parameters (can be tuned via admin)
        'advanced_config' => [
            'guidance_scale' => [
                'default' => null,
                'min' => 0.0,
                'max' => 20.0,
                'help' => 'Higher = more adherence to prompt (null = Replicate default)',
            ],
            'num_inference_steps' => [
                'default' => null,
                'min' => 1,
                'max' => 100,
                'help' => 'Number of inference steps (null = Replicate default)',
            ],
        ],
    ],
];
