<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'stability' => [
        'key' => env('STABILITY_API_KEY'),
    ],

    'cloudinary' => [
        'url' => env('CLOUDINARY_URL'),
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
        'api_key' => env('CLOUDINARY_API_KEY'),
        'api_secret' => env('CLOUDINARY_API_SECRET'),
    ],

    'replicate' => [
        'token' => env('REPLICATE_API_TOKEN'),
        // Optional: USD per second for cost estimation (Replicate API does not return dollar cost).
        // e.g. A100 ~0.0014, or BiRefNet ~0.0021/run ÷ ~2s ≈ 0.00105. Leave empty to log only metrics.
        'price_per_second' => env('REPLICATE_PRICE_PER_SECOND') ? (float) env('REPLICATE_PRICE_PER_SECOND') : null,
    ],

    'photoroom' => [
        'key' => env('PHOTOROOM_API_KEY'),
    ],
];
