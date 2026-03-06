<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Shopify Embedded App Routes
|--------------------------------------------------------------------------
|
| All routes for the Shopify embedded application.
| These routes are automatically prefixed with '/shopify' and use the
| 'verify.shopify' middleware for Shopify OAuth authentication.
|
| Frontend: resources/js/Shopify/
| Controllers: app/Http/Controllers/Shopify/
|
*/

Route::middleware(['verify.shopify'])->group(function () {

    // Dashboard
    Route::get('/', [\App\Http\Controllers\DashboardController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'dashboard'])->name('dashboard');

    // AI Studio (page + legacy generate endpoint)
    Route::get('/ai-studio', [\App\Http\Controllers\ShopifyController::class, 'aiStudio'])->name('ai-studio');
    Route::post('/generate-image', [\App\Http\Controllers\ShopifyController::class, 'generateImage'])->name('generate-image');

    // Settings
    Route::get('/settings', [\App\Http\Controllers\SettingsController::class, 'settings'])->name('settings');
    Route::put('/settings', [\App\Http\Controllers\SettingsController::class, 'updateSettings'])->name('settings.update');

    // Plans & Billing
    Route::get('/plans', [\App\Http\Controllers\BillingController::class, 'billing'])->name('billing');

    // Help & Support
    Route::get('/help', [\App\Http\Controllers\HelpController::class, 'help'])->name('help');

    // AI Models (Virtual Try-On) – Coming Soon
    Route::get('/ai-models', [\App\Http\Controllers\ShopifyController::class, 'aiModels'])->name('ai-models');

    // Background Remover (strategy-based: Replicate / Photoroom)
    Route::post('/remove-background', [\App\Http\Controllers\AiStudioController::class, 'removeBackground'])->name('remove-background');
    Route::get('/background-job/{jobId}', [\App\Http\Controllers\AiStudioController::class, 'checkJobStatus'])->name('background-job.status');
    Route::post('/save-to-shopify', [\App\Http\Controllers\AiStudioController::class, 'saveToShopify'])->name('save-to-shopify');
    Route::get('/recent-generations', [\App\Http\Controllers\AiStudioController::class, 'getRecentGenerations'])->name('recent-generations');
    Route::post('/assign-to-product', [\App\Http\Controllers\AiStudioController::class, 'assignToProduct'])->name('assign-to-product');

    // AI Image Upscaler (modular; uses ImageGeneration with tool_used=upscaler)
    Route::post('/tools/upscale', [\App\Http\Controllers\ImageUpscalerController::class, 'upscale'])->name('tools.upscale');
    Route::get('/tools/upscale-job/{jobId}', [\App\Http\Controllers\ImageUpscalerController::class, 'upscaleJobStatus'])->name('tools.upscale-job');

    // AI Image Enhancer (modular; uses ImageGeneration with tool_used=enhance)
    Route::post('/tools/enhance', [\App\Http\Controllers\ImageEnhancerController::class, 'enhance'])->name('tools.enhance');
    Route::get('/tools/enhance-job/{jobId}', [\App\Http\Controllers\ImageEnhancerController::class, 'enhanceJobStatus'])->name('tools.enhance-job');

    // Magic Eraser (inpainting; Replicate LaMa; image + mask)
    Route::post('/tools/magic-eraser', [\App\Http\Controllers\MagicEraserController::class, 'magicEraser'])->name('tools.magic-eraser');
    Route::get('/tools/magic-eraser-job/{jobId}', [\App\Http\Controllers\MagicEraserController::class, 'magicEraserJobStatus'])->name('tools.magic-eraser-job');

    // Lighting Fix / AI Relighting (Replicate IC-Light; image + prompt)
    Route::post('/tools/lighting', [\App\Http\Controllers\LightingFixController::class, 'lighting'])->name('tools.lighting');
    Route::get('/tools/lighting-job/{jobId}', [\App\Http\Controllers\LightingFixController::class, 'lightingJobStatus'])->name('tools.lighting-job');

    // Product Browse API (Browse from Store modal)
    Route::get('/api/products', [\App\Http\Controllers\ProductBrowseController::class, 'index'])->name('products.browse');
    Route::get('/api/products/{id}', [\App\Http\Controllers\ProductBrowseController::class, 'show'])->name('products.show');

    // Products count API (called by frontend with session token in Authorization header)
    Route::get('/api/products-count', [\App\Http\Controllers\DashboardController::class, 'productsCount'])->name('api.products-count');

    // Debug: verify API credentials (returns products count or error)
    Route::get('/api/verify-products', [\App\Http\Controllers\ShopifyController::class, 'verifyProducts'])->name('api.verify-products');

    /*
    |--------------------------------------------------------------------------
    | API Routes for Shopify App
    |--------------------------------------------------------------------------
    */

    // Example: Product upload endpoint
    // Route::post('/products/upload', [Shopify\ProductController::class, 'upload'])->name('products.upload');
    
    // Example: AI processing trigger
    // Route::post('/ai/process', [Shopify\AIProcessingController::class, 'process'])->name('ai.process');
    
    // Example: Webhook handlers
    // Route::post('/webhooks/products/create', [Shopify\WebhookController::class, 'productCreate']);
    // Route::post('/webhooks/products/update', [Shopify\WebhookController::class, 'productUpdate']);
});
