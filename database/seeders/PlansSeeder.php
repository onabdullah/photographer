<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Osiset\ShopifyApp\Objects\Enums\PlanType;

class PlansSeeder extends Seeder
{
    /**
     * Seed the three recurring subscription plans.
     *
     * Each plan corresponds to a Shopify RecurringApplicationCharge.
     * The `on_install` flag on "Free Trial" ensures Shopify prompts
     * the merchant to accept it immediately after OAuth.
     */
    public function run(): void
    {
        $plans = [
            [
                'type'            => PlanType::RECURRING()->toNative(),
                'name'            => 'Free Trial',
                'price'           => 0.00,
                'capped_amount'   => null,
                'terms'           => null,
                'trial_days'      => 0,
                'test'            => false,
                'on_install'      => true,   // auto-prompt on install
                'monthly_credits' => 5,
            ],
            [
                'type'            => PlanType::RECURRING()->toNative(),
                'name'            => 'Pro',
                'price'           => 19.99,
                'capped_amount'   => null,
                'terms'           => null,
                'trial_days'      => 3,
                'test'            => false,
                'on_install'      => false,
                'monthly_credits' => 500,
            ],
            [
                'type'            => PlanType::RECURRING()->toNative(),
                'name'            => 'Scale',
                'price'           => 49.99,
                'capped_amount'   => null,
                'terms'           => null,
                'trial_days'      => 3,
                'test'            => false,
                'on_install'      => false,
                'monthly_credits' => 2000,
            ],
        ];

        foreach ($plans as $plan) {
            DB::table('plans')->updateOrInsert(
                ['name' => $plan['name']],
                array_merge($plan, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]),
            );
        }
    }
}
