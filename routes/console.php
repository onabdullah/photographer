<?php

use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('roles:seed', function () {
    $this->info('Seeding roles and permissions...');
    $this->call(RolesAndPermissionsSeeder::class);
    $this->info('Done.');
})->purpose('Seed admin roles and permissions (idempotent: skips existing, adds new)');
