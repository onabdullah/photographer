<?php

namespace App\Providers;

use App\Contracts\BackgroundRemoverInterface;
use App\Services\BackgroundRemover\PhotoroomDriver;
use App\Services\BackgroundRemover\ReplicateDriver;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AiServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(BackgroundRemoverInterface::class, function (Application $app) {
            $driver = config('ai.background_remover_driver') ?? env('AI_BKG_DRIVER', 'replicate');

            $concrete = match ($driver) {
                'photoroom' => PhotoroomDriver::class,
                'replicate' => ReplicateDriver::class,
                default => ReplicateDriver::class,
            };

            Log::channel('bg_remover')->info('Background remover driver resolved', [
                'driver_config' => $driver,
                'concrete' => $concrete,
            ]);

            return $app->make($concrete);
        });
    }
}
