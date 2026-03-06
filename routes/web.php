<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
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

