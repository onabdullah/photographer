<?php

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('roles:seed', function () {
    $this->info('Seeding roles and permissions...');
    $this->call(RolesAndPermissionsSeeder::class);
    $this->info('Done.');
})->purpose('Seed admin roles and permissions (idempotent: skips existing, adds new)');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/

// Clean up large-export ZIP files older than 8 days from private storage.
// This matches the 7-day signed-URL window plus one day of grace.
Schedule::call(function () {
    $dir     = storage_path('app/private/exports');
    $cutoff  = now()->subDays(8)->timestamp;
    $deleted = 0;

    if (! is_dir($dir)) {
        return;
    }

    foreach (glob($dir . '/*.zip') ?: [] as $file) {
        if (is_file($file) && filemtime($file) < $cutoff) {
            @unlink($file);
            $deleted++;
        }
    }

    if ($deleted > 0) {
        \Illuminate\Support\Facades\Log::info("CleanupLargeExports: removed {$deleted} expired export file(s).");
    }
})->daily()->name('cleanup-large-exports')->withoutOverlapping();

