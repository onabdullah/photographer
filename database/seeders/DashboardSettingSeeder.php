<?php

namespace Database\Seeders;

use App\Models\DashboardSetting;
use Illuminate\Database\Seeder;

class DashboardSettingSeeder extends Seeder
{
    public function run(): void
    {
        // Hero Section
        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_HERO_TITLE],
            [
                'value' => 'Let\'s grow your business together',
                'group' => 'hero',
            ]
        );

        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_HERO_SUBTITLE],
            [
                'value' => 'Our AI photographer works for you — professional product photos, on demand.',
                'group' => 'hero',
            ]
        );

        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_HERO_IMAGE_URL],
            [
                'value' => 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80',
                'group' => 'hero',
            ]
        );

        // Featured Tools
        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_FEATURED_TOOLS_ENABLED],
            [
                'value' => '1',
                'group' => 'featured_tools',
            ]
        );

        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_FEATURED_TOOLS],
            [
                'value' => json_encode(['magic_eraser', 'remove_bg']),
                'group' => 'featured_tools',
            ]
        );

        // Announcements
        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_ANNOUNCEMENT_ENABLED],
            [
                'value' => '0',
                'group' => 'announcements',
            ]
        );

        DashboardSetting::updateOrCreate(
            ['key' => DashboardSetting::KEY_ANNOUNCEMENT_TEXT],
            [
                'value' => '',
                'group' => 'announcements',
            ]
        );
    }
}
