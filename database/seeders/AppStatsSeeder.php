<?php

namespace Database\Seeders;

use App\Models\AppStat;
use Illuminate\Database\Seeder;

class AppStatsSeeder extends Seeder
{
    public function run(): void
    {
        $keys = [
            'bg_remover_success_count',
            'bg_remover_failed_count',
            'upscaler_success_count',
            'upscaler_failed_count',
            'magic_eraser_success_count',
            'magic_eraser_failed_count',
            'enhance_success_count',
            'enhance_failed_count',
            'lighting_success_count',
            'lighting_failed_count',
            'total_api_requests',
        ];
        foreach ($keys as $key) {
            AppStat::firstOrCreate(
                ['key' => $key],
                ['value' => 0]
            );
        }
    }
}
