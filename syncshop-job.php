#!/usr/bin/env php
<?php

/**
 * Standalone script to sync merchant store name and owner from Shopify.
 * Schedule this file with your hosting cron (e.g. once per hour or daily).
 *
 * Cron examples (run from project root):
 *   Once per hour:  0 * * * * /usr/bin/php /path/to/photographer/syncshop-job.php
 *   Once daily:     0 2 * * * /usr/bin/php /path/to/photographer/syncshop-job.php
 *
 * Replace /path/to/photographer with your Laravel app root (where artisan lives).
 */

use Illuminate\Foundation\Application;
use Symfony\Component\Console\Input\ArgvInput;

// Run from script directory so paths resolve correctly
chdir(__DIR__);

define('LARAVEL_START', microtime(true));

// Maintenance mode check
if (file_exists(__DIR__.'/storage/framework/maintenance.php')) {
    require __DIR__.'/storage/framework/maintenance.php';
}

require __DIR__.'/vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__.'/bootstrap/app.php';

// Run: php artisan merchants:sync-shop-details --missing
$_SERVER['argv'] = ['artisan', 'merchants:sync-shop-details', '--missing'];
$status = $app->handleCommand(new ArgvInput);

exit($status);
