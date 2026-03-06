<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Admin Panel Routes (separate web dashboard, not embedded in Shopify)
|--------------------------------------------------------------------------
|
| The admin panel is a standalone web dashboard at /admin/*. It is NOT
| embedded in the Shopify admin iframe. Auth uses the 'admin' guard (User
| model, Breeze login at /login). Do not load App Bridge or Shopify
| context on these routes.
|
| Frontend: resources/js/Admin/
*/

Route::middleware(['auth:admin'])->group(function () {
    
    // Dashboard - Main admin overview (real stats)
    Route::get('/dashboard', function () {
        $totalMerchants = \App\Models\Merchant::count();
        $imagesGenerated = \App\Models\Image::whereNotNull('generated_image_url')->count();
        $totalCreditsIssued = (int) \App\Models\Merchant::sum('ai_credits_balance');
        $merchantsWithPlan = \App\Models\Merchant::whereNotNull('plan_id')->count();

        $recentMerchants = \App\Models\Merchant::with('plan')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'store_name' => $m->store_name ?: $m->name,
                'domain' => $m->name,
                'plan_name' => $m->plan?->name ?? 'Free',
                'credits' => (int) ($m->ai_credits_balance ?? 0),
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        $recentImages = \App\Models\Image::with('merchant:id,name,store_name')
            ->whereNotNull('generated_image_url')
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($img) => [
                'id' => $img->id,
                'generated_image_url' => $img->generated_image_url,
                'store_name' => $img->merchant?->store_name ?: $img->merchant?->name,
                'created_at' => $img->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Pages/Dashboard', [
            'data' => [
                'totalMerchants' => $totalMerchants,
                'imagesGenerated' => $imagesGenerated,
                'totalCreditsIssued' => $totalCreditsIssued,
                'merchantsWithPlan' => $merchantsWithPlan,
                'recentMerchants' => $recentMerchants,
                'recentImages' => $recentImages,
            ],
        ]);
    })->name('dashboard');

    // Merchant Management
    Route::get('/merchants', function () {
        $merchants = \App\Models\Merchant::with('plan')
            ->withCount(['images as images_generated_count' => function ($q) {
                $q->whereNotNull('generated_image_url');
            }])
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/Pages/Merchants/Index', [
            'merchants' => $merchants,
        ]);
    })->name('merchants.index');

    Route::get('/merchants/{id}', function ($id) {
        return Inertia::render('Admin/Pages/Merchants/Show', [
            'merchantId' => $id,
        ]);
    })->name('merchants.show');

    // Product Management - View all products across merchants
    Route::get('/products', function () {
        return Inertia::render('Admin/Pages/Products/Index');
    })->name('products.index');

    Route::get('/products/{id}', function ($id) {
        return Inertia::render('Admin/Pages/Products/Show', [
            'productId' => $id,
        ]);
    })->name('products.show');

    // AI Processing - Monitor all AI jobs
    Route::get('/ai-processing', function () {
        return Inertia::render('Admin/Pages/AIProcessing/Index');
    })->name('ai-processing.index');

    Route::get('/ai-processing/{id}', function ($id) {
        return Inertia::render('Admin/Pages/AIProcessing/Show', [
            'jobId' => $id,
        ]);
    })->name('ai-processing.show');

    // Analytics & Reporting
    Route::get('/analytics', function () {
        return Inertia::render('Admin/Pages/Analytics');
    })->name('analytics');

    // System Settings
    Route::get('/settings', function () {
        return Inertia::render('Admin/Pages/Settings');
    })->name('settings');

    /*
    |--------------------------------------------------------------------------
    | Artisan Terminal
    |--------------------------------------------------------------------------
    */
    Route::get('/terminal',     [\App\Http\Controllers\Admin\TerminalController::class, 'index'])->name('terminal');
    Route::post('/terminal/run',[\App\Http\Controllers\Admin\TerminalController::class, 'run'])->name('terminal.run');

    /*
    |--------------------------------------------------------------------------
    | Role Management
    |--------------------------------------------------------------------------
    */
    Route::get('/roles',                  [\App\Http\Controllers\Admin\RoleController::class, 'index'])->name('roles.index');
    Route::get('/roles/create',           [\App\Http\Controllers\Admin\RoleController::class, 'create'])->name('roles.create');
    Route::post('/roles',                 [\App\Http\Controllers\Admin\RoleController::class, 'store'])->name('roles.store');
    Route::get('/roles/{adminRole}',      [\App\Http\Controllers\Admin\RoleController::class, 'show'])->name('roles.show');
    Route::get('/roles/{adminRole}/edit', [\App\Http\Controllers\Admin\RoleController::class, 'edit'])->name('roles.edit');
    Route::put('/roles/{adminRole}',      [\App\Http\Controllers\Admin\RoleController::class, 'update'])->name('roles.update');
    Route::delete('/roles/{adminRole}',   [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])->name('roles.destroy');

    /*
    |--------------------------------------------------------------------------
    | User Management
    |--------------------------------------------------------------------------
    */
    Route::get('/users',                   [\App\Http\Controllers\Admin\UserController::class, 'index'])->name('users.index');
    Route::get('/users/{user}',            [\App\Http\Controllers\Admin\UserController::class, 'show'])->name('users.show');
    Route::get('/users/{user}/edit',       [\App\Http\Controllers\Admin\UserController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}',            [\App\Http\Controllers\Admin\UserController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/status',    [\App\Http\Controllers\Admin\UserController::class, 'updateStatus'])->name('users.status');
});
