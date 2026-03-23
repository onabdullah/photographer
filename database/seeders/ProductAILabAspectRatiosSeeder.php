<?php

namespace Database\Seeders;

use App\Models\ProductAILabAspectRatio;
use Illuminate\Database\Seeder;

class ProductAILabAspectRatiosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // All 15 Nano Banana 2 supported aspect ratios
        $aspectRatios = [
            ['value' => 'match_input_image', 'label' => 'Match Input Image', 'order_position' => 1, 'is_enabled' => true, 'is_default' => false],
            ['value' => '1:1', 'label' => '1:1 (Square)', 'order_position' => 2, 'is_enabled' => true, 'is_default' => true],
            ['value' => '1:4', 'label' => '1:4 (Tall)', 'order_position' => 3, 'is_enabled' => false, 'is_default' => false],
            ['value' => '1:8', 'label' => '1:8 (Very Tall)', 'order_position' => 4, 'is_enabled' => false, 'is_default' => false],
            ['value' => '2:3', 'label' => '2:3', 'order_position' => 5, 'is_enabled' => false, 'is_default' => false],
            ['value' => '3:2', 'label' => '3:2', 'order_position' => 6, 'is_enabled' => false, 'is_default' => false],
            ['value' => '3:4', 'label' => '3:4 (Portrait)', 'order_position' => 7, 'is_enabled' => true, 'is_default' => false],
            ['value' => '4:1', 'label' => '4:1 (Ultra Wide)', 'order_position' => 8, 'is_enabled' => false, 'is_default' => false],
            ['value' => '4:3', 'label' => '4:3 (Classic)', 'order_position' => 9, 'is_enabled' => true, 'is_default' => false],
            ['value' => '4:5', 'label' => '4:5', 'order_position' => 10, 'is_enabled' => false, 'is_default' => false],
            ['value' => '5:4', 'label' => '5:4', 'order_position' => 11, 'is_enabled' => false, 'is_default' => false],
            ['value' => '8:1', 'label' => '8:1 (Panoramic)', 'order_position' => 12, 'is_enabled' => false, 'is_default' => false],
            ['value' => '9:16', 'label' => '9:16 (Mobile)', 'order_position' => 13, 'is_enabled' => true, 'is_default' => false],
            ['value' => '16:9', 'label' => '16:9 (Widescreen)', 'order_position' => 14, 'is_enabled' => true, 'is_default' => false],
            ['value' => '21:9', 'label' => '21:9 (Ultra Wide)', 'order_position' => 15, 'is_enabled' => false, 'is_default' => false],
        ];

        foreach ($aspectRatios as $ratio) {
            ProductAILabAspectRatio::updateOrCreate(
                ['value' => $ratio['value']],
                $ratio
            );
        }
    }
}
