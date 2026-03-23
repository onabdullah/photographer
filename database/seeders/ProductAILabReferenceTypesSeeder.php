<?php

namespace Database\Seeders;

use App\Models\ProductAILabReferenceType;
use Illuminate\Database\Seeder;

class ProductAILabReferenceTypesSeeder extends Seeder
{
    public function run(): void
    {
        $referenceTypes = [
            [
                'slug' => 'style',
                'name' => 'Style',
                'description' => 'Visual aesthetic & mood',
                'prompt_template' => 'Apply the visual style from the reference image',
                'max_images_allowed' => 1,
                'order_position' => 1,
                'is_enabled' => true,
            ],
            [
                'slug' => 'face',
                'name' => 'Face',
                'description' => 'Character & expression',
                'prompt_template' => 'Use facial features similar to the reference',
                'max_images_allowed' => 1,
                'order_position' => 2,
                'is_enabled' => true,
            ],
            [
                'slug' => 'pose',
                'name' => 'Pose',
                'description' => 'Body position & composition',
                'prompt_template' => 'Match the pose and composition from the reference',
                'max_images_allowed' => 1,
                'order_position' => 3,
                'is_enabled' => true,
            ],
        ];

        foreach ($referenceTypes as $type) {
            ProductAILabReferenceType::updateOrCreate(
                ['slug' => $type['slug']],
                $type
            );
        }
    }
}
