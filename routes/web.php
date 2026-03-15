<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schedule;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (request()->has('shop')) {
        return redirect()->route('shopify.dashboard', request()->all());
    }
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Profile Management Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Load Modular Routes
|--------------------------------------------------------------------------
*/

// Authentication routes (login, register, password reset, etc.)
require __DIR__.'/auth.php';

// Shopify embedded app routes
Route::prefix('shopify')
    ->name('shopify.')
    ->group(base_path('routes/shopify.php'));

// Internal admin panel routes
Route::prefix('admin')
    ->name('admin.')
    ->group(base_path('routes/admin.php'));

/*
|--------------------------------------------------------------------------
| Large-Export Download
|--------------------------------------------------------------------------
| Signed, time-limited download links emailed to store owners for exports
| that exceed the inline attachment threshold. No Shopify auth required —
| the link is clicked directly from an email client.
|--------------------------------------------------------------------------
*/
Route::get('/export/download/{filename}', [\App\Http\Controllers\AiStudioController::class, 'serveExportDownload'])
    ->name('export.download')
    ->where('filename', '[a-f0-9\-]+');

/*
|--------------------------------------------------------------------------
| Shopify GDPR / Privacy Webhooks
|--------------------------------------------------------------------------
| Required by Shopify App Store rules for every listed app.
| Registered in Partner Dashboard → App → Privacy → GDPR webhooks.
| Protected by HMAC verification middleware (no CSRF / session auth needed).
|--------------------------------------------------------------------------
*/
Route::middleware([\App\Http\Middleware\VerifyShopifyWebhookHmac::class])
    ->prefix('webhooks/privacy')
    ->name('webhooks.privacy.')
    ->group(function () {
        Route::post('customers-data-request', [\App\Http\Controllers\PrivacyWebhookController::class, 'customerDataRequest'])->name('customers-data-request');
        Route::post('customers-redact',       [\App\Http\Controllers\PrivacyWebhookController::class, 'customerRedact'])->name('customers-redact');
        Route::post('shop-redact',            [\App\Http\Controllers\PrivacyWebhookController::class, 'shopRedact'])->name('shop-redact');
    });

Route::get('/debug-conv', function() { return App\Models\LiveChatConversation::with(['merchant.plan', 'merchant.imageGenerations'])->latest()->first(); });
