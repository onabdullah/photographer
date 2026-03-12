<?php

namespace Database\Seeders;

use App\Models\CreditPack;
use Illuminate\Database\Seeder;

class CreditPackSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $packs = [
            [
                'credits' => 100,
                'price' => 5.99,
                'per_credit_cost' => 0.0599,
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'credits' => 250,
                'price' => 8.99,
                'per_credit_cost' => 0.036,
                'is_popular' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'credits' => 500,
                'price' => 16.99,
                'per_credit_cost' => 0.034,
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'credits' => 1000,
                'price' => 21.99,
                'per_credit_cost' => 0.022,
                'is_popular' => false,
                'is_active' => true,
                'sort_order' => 4,
            ],
        ];

        foreach ($packs as $pack) {
            CreditPack::updateOrCreate(
                ['credits' => $pack['credits']],
                $pack
            );
        }

        $this->command->info('Credit packs seeded successfully!');
    }
}
