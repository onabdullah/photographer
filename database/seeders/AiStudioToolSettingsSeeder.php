<?php

namespace Database\Seeders;

use App\Models\AiStudioToolSetting;
use Illuminate\Database\Seeder;

class AiStudioToolSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $order = config('ai_studio_tools.tool_order', []);
        foreach ($order as $toolKey) {
            AiStudioToolSetting::firstOrCreate(
                ['tool_key' => $toolKey],
                ['is_enabled' => true]
            );
        }
    }
}
