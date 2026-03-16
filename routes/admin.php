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
        $imagesGenerated = \App\Models\ImageGeneration::where('status', 'completed')->whereNotNull('result_image_url')->count();
        $totalCreditsIssued = (int) \App\Models\Merchant::sum('ai_credits_balance');
        $merchantsWithPlan = \App\Models\Merchant::whereNotNull('plan_id')->count();
        $newMerchantsLast7Days = \App\Models\Merchant::where('created_at', '>=', now()->subDays(7))->count();
        $aiStudioRunsTotal = \App\Models\ImageGeneration::where('status', 'completed')->whereNotNull('result_image_url')->count();
        $aiStudioRunsLast7Days = \App\Models\ImageGeneration::where('status', 'completed')->whereNotNull('result_image_url')->where('created_at', '>=', now()->subDays(7))->count();

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

        $recentGenerations = \App\Models\ImageGeneration::where('status', 'completed')
            ->whereNotNull('result_image_url')
            ->latest('updated_at')
            ->take(8)
            ->get(['id', 'shop_domain', 'result_image_url', 'created_at', 'updated_at']);
        $baseUrl = rtrim(request()->getSchemeAndHttpHost(), '/');
        $recentImages = $recentGenerations->map(function ($gen) use ($baseUrl) {
            $url = $gen->result_image_url;
            if ($url && str_starts_with($url, '/')) {
                $url = $baseUrl . $url;
            }
            return [
                'id' => $gen->id,
                'generated_image_url' => $url,
                'store_name' => $gen->shop_domain ?? '—',
                'created_at' => ($gen->updated_at ?? $gen->created_at)?->toIso8601String(),
            ];
        })->toArray();

        return Inertia::render('Admin/Pages/Dashboard', [
            'data' => [
                'totalMerchants' => $totalMerchants,
                'imagesGenerated' => $imagesGenerated,
                'totalCreditsIssued' => $totalCreditsIssued,
                'merchantsWithPlan' => $merchantsWithPlan,
                'newMerchantsLast7Days' => $newMerchantsLast7Days,
                'aiStudioRunsTotal' => $aiStudioRunsTotal,
                'aiStudioRunsLast7Days' => $aiStudioRunsLast7Days,
                'recentMerchants' => $recentMerchants,
                'recentImages' => $recentImages,
            ],
        ]);
    })->middleware('admin.permission:dashboard.view')->name('dashboard');

    // Merchant Management
    Route::get('/merchants', function () {
        $merchants = \App\Models\Merchant::with('plan')
            ->withCount(['imageGenerations as images_generated_count' => function ($q) {
                $q->where('status', 'completed')->whereNotNull('result_image_url');
            }])
            ->latest()
            ->paginate(15);

        return Inertia::render('Admin/Pages/Merchants/Index', [
            'merchants' => $merchants,
        ]);
    })->middleware('admin.permission:merchants.view')->name('merchants.index');

    Route::get('/merchants/{id}', function ($id) {
        return Inertia::render('Admin/Pages/Merchants/Show', [
            'merchantId' => $id,
        ]);
    })->middleware('admin.permission:merchants.view')->name('merchants.show');

    Route::patch('/merchants/{id}/credits', [\App\Http\Controllers\Admin\MerchantController::class, 'updateCredits'])
        ->middleware('admin.permission:merchants.edit_credits')
        ->name('merchants.update-credits');

    // Product Management - View all products across merchants
    Route::get('/products', function () {
        return Inertia::render('Admin/Pages/Products/Index');
    })->middleware('admin.permission:products.view')->name('products.index');

    Route::get('/products/{id}', function ($id) {
        return Inertia::render('Admin/Pages/Products/Show', [
            'productId' => $id,
        ]);
    })->middleware('admin.permission:products.view')->name('products.show');

    // AI Processing - Masterpieces gallery by category
    Route::get('/ai-processing', [\App\Http\Controllers\Admin\AIProcessingController::class, 'index'])
        ->middleware('admin.permission:ai.view')
        ->name('ai-processing.index');

    Route::get('/ai-processing/{id}', function ($id) {
        return Inertia::render('Admin/Pages/AIProcessing/Show', [
            'jobId' => $id,
        ]);
    })->middleware('admin.permission:ai.view')->name('ai-processing.show');

    // Analytics & Reporting
    Route::get('/analytics', \App\Http\Controllers\Admin\AnalyticsController::class)
        ->middleware('admin.permission:analytics.view')
        ->name('analytics');

    // Finance
    Route::get('/finance', function () {
        return Inertia::render('Admin/Pages/Finance');
    })->middleware('admin.permission:finance.view')->name('finance');

    // Billing Management (Plans + Credit Packs + Analytics)
    Route::get('/billing-management', [\App\Http\Controllers\Admin\BillingManagementController::class, 'index'])
        ->middleware('admin.permission:plans.view')
        ->name('billing-management');

    // Redirects from old URLs to new unified billing page
    Route::get('/plans', fn() => redirect('/admin/billing-management?tab=plans'))
        ->middleware('admin.permission:plans.view');
    Route::get('/credit-packs', fn() => redirect('/admin/billing-management?tab=credit-packs'))
        ->middleware('admin.permission:plans.view');

    // Plans Management (CRUD endpoints)
    Route::prefix('plans')->name('plans.')->group(function () {
        Route::post('/', [\App\Http\Controllers\Admin\PlanController::class, 'store'])
            ->middleware('admin.permission:plans.manage')
            ->name('store');
        Route::put('/{id}', [\App\Http\Controllers\Admin\PlanController::class, 'update'])
            ->middleware('admin.permission:plans.manage')
            ->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Admin\PlanController::class, 'destroy'])
            ->middleware('admin.permission:plans.manage')
            ->name('destroy');
    });

    // Credit Packs Management (CRUD endpoints)
    Route::prefix('credit-packs')->name('credit-packs.')->group(function () {
        Route::post('/', [\App\Http\Controllers\Admin\CreditPackController::class, 'store'])
            ->middleware('admin.permission:plans.manage')
            ->name('store');
        Route::put('/{creditPack}', [\App\Http\Controllers\Admin\CreditPackController::class, 'update'])
            ->middleware('admin.permission:plans.manage')
            ->name('update');
        Route::delete('/{creditPack}', [\App\Http\Controllers\Admin\CreditPackController::class, 'destroy'])
            ->middleware('admin.permission:plans.manage')
            ->name('destroy');
    });

    Route::get('/ai-studio-tools', \App\Http\Controllers\Admin\AiStudioToolsController::class)
        ->middleware('admin.permission:ai_studio.view')
        ->name('ai-studio-tools');
    Route::patch('/ai-studio-tools/settings', [\App\Http\Controllers\Admin\AiStudioToolsController::class, 'updateToolSetting'])
        ->middleware('admin.permission:ai_studio.view')
        ->name('ai-studio-tools.settings');

    // Dashboard Content Management
    Route::put('/dashboard-settings', [\App\Http\Controllers\Admin\DashboardSettingsController::class, 'update'])
        ->middleware('admin.permission:settings.manage')
        ->name('dashboard-settings.update');
    Route::post('/dashboard-settings/reset', [\App\Http\Controllers\Admin\DashboardSettingsController::class, 'reset'])
        ->middleware('admin.permission:settings.manage')
        ->name('dashboard-settings.reset');

    // Dashboard Media Upload
    Route::post('/dashboard-media/upload-hero', [\App\Http\Controllers\Admin\DashboardMediaController::class, 'uploadHeroImage'])
        ->middleware('admin.permission:settings.manage')
        ->name('dashboard-media.upload-hero');
    Route::delete('/dashboard-media/{path}', [\App\Http\Controllers\Admin\DashboardMediaController::class, 'deleteHeroImage'])
        ->middleware('admin.permission:settings.manage')
        ->name('dashboard-media.delete');

    // System Settings (SMTP: super_admin only, enforced in controller)
    Route::get('/settings', [\App\Http\Controllers\Admin\SettingsController::class, 'index'])
        ->middleware('admin.permission:settings.view')->name('settings');
    Route::post('/settings/smtp', [\App\Http\Controllers\Admin\SettingsController::class, 'storeSmtp'])
        ->middleware('admin.permission:settings.smtp')->name('settings.smtp.store');
    Route::put('/settings/smtp/{smtpSetting}', [\App\Http\Controllers\Admin\SettingsController::class, 'updateSmtp'])
        ->middleware('admin.permission:settings.smtp')->name('settings.smtp.update');
    Route::delete('/settings/smtp/{smtpSetting}', [\App\Http\Controllers\Admin\SettingsController::class, 'destroySmtp'])
        ->middleware('admin.permission:settings.smtp')->name('settings.smtp.destroy');
    Route::post('/settings/smtp/{smtpSetting}/active', [\App\Http\Controllers\Admin\SettingsController::class, 'setActiveSmtp'])
        ->middleware('admin.permission:settings.smtp')->name('settings.smtp.set-active');
    Route::post('/settings/smtp/test', [\App\Http\Controllers\Admin\SettingsController::class, 'testSmtp'])
        ->middleware('admin.permission:settings.smtp')->name('settings.smtp.test');

    Route::post('/settings/general', [\App\Http\Controllers\Admin\SettingsController::class, 'updateGeneral'])
        ->middleware('admin.permission:settings.manage')->name('settings.general.update');
    Route::put('/settings/password', [\App\Http\Controllers\Admin\SettingsController::class, 'updatePassword'])
        ->name('settings.password.update');
    Route::put('/settings/security', [\App\Http\Controllers\Admin\SettingsController::class, 'updateSecurity'])
        ->middleware('admin.permission:settings.manage')->name('settings.security.update');
    Route::post('/settings/two-factor/setup', [\App\Http\Controllers\Admin\SettingsController::class, 'twoFactorSetup'])
        ->name('settings.two-factor.setup');
    Route::post('/settings/two-factor/confirm', [\App\Http\Controllers\Admin\SettingsController::class, 'twoFactorConfirm'])
        ->name('settings.two-factor.confirm');
    Route::post('/settings/two-factor/disable', [\App\Http\Controllers\Admin\SettingsController::class, 'twoFactorDisable'])
        ->name('settings.two-factor.disable');

    /*
    |--------------------------------------------------------------------------
    | Artisan Terminal
    |--------------------------------------------------------------------------
    */
    Route::get('/terminal', [\App\Http\Controllers\Admin\TerminalController::class, 'index'])
        ->middleware('admin.permission:developer.terminal')
        ->name('terminal');
    Route::post('/terminal/run', [\App\Http\Controllers\Admin\TerminalController::class, 'run'])
        ->middleware('admin.permission:developer.terminal')
        ->name('terminal.run');

    /*
    |--------------------------------------------------------------------------
    | Role Management
    |--------------------------------------------------------------------------
    */
    Route::get('/roles', [\App\Http\Controllers\Admin\RoleController::class, 'index'])
        ->middleware('admin.permission:roles.view')->name('roles.index');
    Route::get('/roles/create', [\App\Http\Controllers\Admin\RoleController::class, 'create'])
        ->middleware('admin.permission:roles.manage')->name('roles.create');
    Route::post('/roles', [\App\Http\Controllers\Admin\RoleController::class, 'store'])
        ->middleware('admin.permission:roles.manage')->name('roles.store');
    Route::get('/roles/{adminRole}', [\App\Http\Controllers\Admin\RoleController::class, 'show'])
        ->middleware('admin.permission:roles.view')->name('roles.show');
    Route::get('/roles/{adminRole}/edit', [\App\Http\Controllers\Admin\RoleController::class, 'edit'])
        ->middleware('admin.permission:roles.manage')->name('roles.edit');
    Route::put('/roles/{adminRole}', [\App\Http\Controllers\Admin\RoleController::class, 'update'])
        ->middleware('admin.permission:roles.manage')->name('roles.update');
    Route::delete('/roles/{adminRole}', [\App\Http\Controllers\Admin\RoleController::class, 'destroy'])
        ->middleware('admin.permission:roles.manage')->name('roles.destroy');

    /*
    |--------------------------------------------------------------------------
    | User Management
    |--------------------------------------------------------------------------
    */
    Route::get('/users', [\App\Http\Controllers\Admin\UserController::class, 'index'])
        ->middleware('admin.permission:users.view')->name('users.index');
    Route::get('/users/create', [\App\Http\Controllers\Admin\UserController::class, 'create'])
        ->middleware('admin.permission:users.manage')->name('users.create');
    Route::post('/users', [\App\Http\Controllers\Admin\UserController::class, 'store'])
        ->middleware('admin.permission:users.manage')->name('users.store');
    Route::get('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'show'])
        ->middleware('admin.permission:users.view')->name('users.show');
    Route::get('/users/{user}/edit', [\App\Http\Controllers\Admin\UserController::class, 'edit'])
        ->middleware('admin.permission:users.manage')->name('users.edit');
    Route::put('/users/{user}', [\App\Http\Controllers\Admin\UserController::class, 'update'])
        ->middleware('admin.permission:users.manage')->name('users.update');
    Route::post('/users/{user}/status', [\App\Http\Controllers\Admin\UserController::class, 'updateStatus'])
        ->middleware('admin.permission:users.manage')->name('users.status');

    /*
    |--------------------------------------------------------------------------
    | Live Chat Console
    |--------------------------------------------------------------------------
    */
    Route::prefix('live-chat')->name('live-chat.')->group(function () {
        // Inertia console page
        Route::get('/', [\App\Http\Controllers\Admin\LiveChatController::class, 'index'])
            ->middleware('admin.permission:live_chat.view')
            ->name('index');

        // JSON API used by the thread panel
        Route::get('/conversations/{id}/messages', [\App\Http\Controllers\Admin\LiveChatController::class, 'messages'])
            ->middleware('admin.permission:live_chat.view')
            ->name('messages');

        // Manual-refresh poll endpoint
        Route::get('/conversations/{id}/poll', [\App\Http\Controllers\Admin\LiveChatController::class, 'poll'])
            ->middleware('admin.permission:live_chat.view')
            ->name('poll');

        // Send a message / internal note
        Route::post('/conversations/{id}/messages', [\App\Http\Controllers\Admin\LiveChatController::class, 'sendMessage'])
            ->middleware('admin.permission:live_chat.manage')
            ->name('send');

        // Transition state (end, spam, block, mute, convert, etc.)
        Route::post('/conversations/{id}/state', [\App\Http\Controllers\Admin\LiveChatController::class, 'updateState'])
            ->middleware('admin.permission:live_chat.manage')
            ->name('state');

        // Sync settings (admin Section 15 of PRD)
        Route::post('/sync-settings', [\App\Http\Controllers\Admin\LiveChatController::class, 'saveSyncSettings'])
            ->middleware('admin.permission:live_chat.manage')
            ->name('sync-settings');
    });
});
