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
            'model_name' => 'Nano Banana 2 (Google Gemini)',
            'model_provider' => 'Replicate',
            'estimated_rate_per_image_usd' => 0.067,
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

    /*
    |--------------------------------------------------------------------------
    | Product AI Lab (VTO) Configuration
    | Uses: google/nano-banana-2 (Replicate API)
    | Based on: Exact Replicate input schema
    |--------------------------------------------------------------------------
    */
    'product_ai_lab' => [
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
        ],

        // Feature flags matching Replicate API boolean parameters
        'features' => [
            'google_search' => [
                'enabled' => false,
                'label' => 'Google Search Grounding',
                'description' => 'Use Google Web Search for real-time context (weather, events, etc.)',
            ],
            'image_search' => [
                'enabled' => false,
                'label' => 'Image Search Grounding',
                'description' => 'Use Google Image Search to find web images as visual references',
            ],
        ],

        // Cost per resolution (Replicate pricing)
        'cost_per_resolution' => [
            '1K' => 0.067,
            '2K' => 0.101,
            '4K' => 0.151,
        ],

        // Cost multiplier when search grounding is enabled (+50%)
        'cost_multiplier_with_search' => 1.5,
    ],

    /*
    |--------------------------------------------------------------------------
    | Magic Eraser Configuration
    | Uses: google/nano-banana-2 (Replicate API)
    | Purpose: Remove and replace objects/areas in product images
    |--------------------------------------------------------------------------
    */
    'magic_eraser' => [
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
        ],

        // Cost per resolution (Replicate pricing)
        'cost_per_resolution' => [
            '1K' => 0.067,
            '2K' => 0.101,
            '4K' => 0.151,
        ],

        // Cost multiplier when search grounding is enabled (+50%)
        'cost_multiplier_with_search' => 1.5,

        // Feature flags matching Replicate API boolean parameters
        'features' => [
            'google_search' => [
                'enabled' => false,
                'label' => 'Google Search Grounding',
                'description' => 'Use Google Web Search for context (optional)',
            ],
            'image_search' => [
                'enabled' => false,
                'label' => 'Image Search Grounding',
                'description' => 'Use Google Image Search for visual references (optional)',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Background Remover Configuration
    | Uses: men1scus/birefnet (Replicate API)
    | Purpose: Remove background from product images
    |--------------------------------------------------------------------------
    */
    'background_remover' => [
        'model_version' => 'f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7',

        'defaults' => [
            'resolution' => '',
        ],

        'supported_fields' => [
            'resolution' => [
                '',  // auto
                '512x512',
                '1024x1024',
                '2048x2048',
            ],
        ],

        // Cost per image (Replicate pricing - fixed rate for BiRefNet)
        'cost_per_image' => 0.0023,
    ],

    /*
    |--------------------------------------------------------------------------
    | Upscaler Configuration
    | Uses: nightmareai/real-esrgan (Replicate API)
    | Purpose: Upscale images with optional face enhancement
    |--------------------------------------------------------------------------
    */
    'upscaler' => [
        'model_version' => 'e0e41191a09250ae4688a43ce19e639c8fef9ca48fb2834d12b78b52532bd4a6',

        'defaults' => [
            'scale' => 4,
            'face_enhance' => false,
        ],

        'supported_fields' => [
            'scale' => [
                'min' => 1,
                'max' => 10,
            ],
        ],

        // Cost per image (Replicate pricing - fixed rate for Real-ESRGAN)
        'cost_per_image' => 0.0023,
    ],

    /*
    |--------------------------------------------------------------------------
    | Lighting Fix Configuration
    | Uses: zsxkib/ic-light (Replicate API)
    | Purpose: Apply relighting and lighting effects to product images
    |--------------------------------------------------------------------------
    */
    'lighting_fix' => [
        'model_version' => 'd41bcb10d8c159868f4cfbd7c6a2ca01484f7d39e4613419d5952c61562f1ba7',

        'defaults' => [
            'appended_prompt' => 'best quality',
            'negative_prompt' => 'lowres, bad anatomy, bad hands, cropped, worst quality',
            'light_source' => 'None',
            'output_format' => 'webp',
            'width' => 512,
            'height' => 640,
            'cfg' => 2,
            'steps' => 25,
            'highres_scale' => 1.5,
            'lowres_denoise' => 0.9,
            'highres_denoise' => 0.5,
            'output_quality' => 80,
            'number_of_images' => 1,
        ],

        'supported_fields' => [
            'light_source' => [
                'None',
                'Left Light',
                'Right Light',
                'Top Light',
                'Bottom Light',
            ],
            'output_format' => ['webp', 'jpg', 'png'],
            'width' => [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024],
            'height' => [256, 320, 384, 448, 512, 576, 640, 704, 768, 832, 896, 960, 1024],
            'cfg' => [
                'min' => 1,
                'max' => 32,
            ],
            'steps' => [
                'min' => 1,
                'max' => 100,
            ],
            'highres_scale' => [
                'min' => 1,
                'max' => 3,
            ],
            'lowres_denoise' => [
                'min' => 0.1,
                'max' => 1,
            ],
            'highres_denoise' => [
                'min' => 0.1,
                'max' => 1,
            ],
            'output_quality' => [
                'min' => 0,
                'max' => 100,
            ],
            'number_of_images' => [
                'min' => 1,
                'max' => 12,
            ],
        ],

        // Cost per image (Replicate pricing)
        'cost_per_image' => 0.0035,
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Enhancer Configuration
    | Uses: google/nano-banana-2 (Replicate API)
    | Purpose: Enhance and regenerate product images with better quality/composition
    |--------------------------------------------------------------------------
    */
    'enhance' => [
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
        ],

        // Feature flags matching Replicate API boolean parameters
        'features' => [
            'google_search' => [
                'enabled' => false,
                'label' => 'Google Search Grounding',
                'description' => 'Use Google Web Search for real-time context',
            ],
            'image_search' => [
                'enabled' => false,
                'label' => 'Image Search Grounding',
                'description' => 'Use Google Image Search to find web images as visual references',
            ],
        ],

        // Cost per resolution (Replicate pricing)
        'cost_per_resolution' => [
            '1K' => 0.067,
            '2K' => 0.101,
            '4K' => 0.151,
        ],

        // Cost multiplier when search grounding is enabled (+50%)
        'cost_multiplier_with_search' => 1.5,
    ],
];


