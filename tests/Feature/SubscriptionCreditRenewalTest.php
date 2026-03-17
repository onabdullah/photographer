<?php

namespace Tests\Feature;

use App\Models\ImageGeneration;
use App\Models\Merchant;
use App\Models\Plan;
use App\Services\MerchantCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SubscriptionCreditRenewalTest extends TestCase
{
    use RefreshDatabase;

    private Merchant $merchant;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plan = Plan::create([
            'name' => 'Pro',
            'type' => 'RECURRING',
            'price' => 19.99,
            'trial_days' => 0,
            'monthly_credits' => 500,
            'on_install' => false,
            'test' => false,
        ]);

        $this->merchant = Merchant::create([
            'name' => 'test-store.myshopify.com',
            'email' => 'test@example.com',
            'password' => 'hashed_password',
            'plan_id' => $this->plan->id,
            'ai_credits_balance' => 0,
            'app_settings' => [],
        ]);
    }

    #[Test]
    public function merchant_starting_plan_initializes_subscription_cycle(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        $this->merchant->refresh();

        $this->assertNotNull($this->merchant->subscription_cycle_started_at);
        $this->assertNotNull($this->merchant->subscription_renewed_at);
        $this->assertNotNull($this->merchant->subscription_renews_at);

        $summary = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(500, $summary['plan_cycle_remaining']);
        $this->assertEquals(500, $summary['total_credits']);
    }

    #[Test]
    public function using_credits_in_current_cycle_works_correctly(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        // Simulate generating images and using credits
        for ($i = 0; $i < 3; $i++) {
            MerchantCreditService::deductCredits($this->merchant, 50);
        }

        $summary = MerchantCreditService::getSummary($this->merchant);

        $this->assertEquals(350, $summary['plan_cycle_remaining']);
        $this->assertEquals(350, $summary['total_credits']);
    }

    #[Test]
    public function automatic_renewal_happens_when_cycle_ends(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        // Use most of the credits
        MerchantCreditService::deductCredits($this->merchant, 450);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(50, $summaryBefore['plan_cycle_remaining']);

        // Move subscription_renews_at to the past
        $this->merchant->update([
            'subscription_renews_at' => now()->subHour(),
        ]);

        // Check and renew
        $renewed = MerchantCreditService::checkAndRenewSubscription($this->merchant);
        $this->assertTrue($renewed);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Credits should be fully restored
        $this->assertEquals(500, $summaryAfter['plan_cycle_remaining']);
    }

    #[Test]
    public function topup_credits_persist_across_renewals(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 200);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(200, $summaryBefore['top_up_credits']);

        // Trigger renewal
        $this->merchant->update([
            'subscription_renews_at' => now()->subHour(),
        ]);

        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Top-up should persist
        $this->assertEquals(200, $summaryAfter['top_up_credits']);
        // Plan should reset
        $this->assertEquals(500, $summaryAfter['plan_cycle_remaining']);
    }

    #[Test]
    public function deduction_uses_plan_credits_first_then_topup(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        // Deduct more than plan remaining
        MerchantCreditService::deductCredits($this->merchant, 550);

        $summary = MerchantCreditService::getSummary($this->merchant);

        // Plan should be empty
        $this->assertEquals(0, $summary['plan_cycle_remaining']);
        // Top-up should have 50 left
        $this->assertEquals(50, $summary['top_up_credits']);
    }

    #[Test]
    public function renewal_does_not_affect_unused_topup_credits(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 150);

        // Use only plan credits
        MerchantCreditService::deductCredits($this->merchant, 300);

        // Trigger renewal
        $this->merchant->update([
            'subscription_renews_at' => now()->subMinute(),
        ]);

        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summary = MerchantCreditService::getSummary($this->merchant);

        // Plan should be reset
        $this->assertEquals(500, $summary['plan_cycle_remaining']);
        // Top-up should be exactly as before (150)
        $this->assertEquals(150, $summary['top_up_credits']);
        // Total should be both
        $this->assertEquals(650, $summary['total_credits']);
    }

    #[Test]
    public function merchant_can_purchase_credits_independently_of_plan(): void
    {
        // Don't even start a subscription, just add top-ups
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        $summary = MerchantCreditService::getSummary($this->merchant);

        $this->assertEquals(100, $summary['top_up_credits']);
        $this->assertEquals(0, $summary['plan_cycle_credits']);
        $this->assertEquals(100, $summary['total_credits']);
    }

    #[Test]
    public function multiple_renewals_work_correctly(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        for ($cycle = 0; $cycle < 3; $cycle++) {
            // Use credits in this cycle
            MerchantCreditService::deductCredits($this->merchant, 200);

            $summary = MerchantCreditService::getSummary($this->merchant);
            $this->assertEquals(300, $summary['plan_cycle_remaining']);

            // Trigger renewal
            $this->merchant->update([
                'subscription_renews_at' => now()->subSecond(),
            ]);

            MerchantCreditService::renewSubscriptionCycle($this->merchant);

            $summaryAfter = MerchantCreditService::getSummary($this->merchant);
            $this->assertEquals(500, $summaryAfter['plan_cycle_remaining']);
        }
    }

    #[Test]
    public function check_and_renew_is_safe_to_call_multiple_times(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $this->merchant->update([
            'subscription_renews_at' => now()->subHour(),
        ]);

        // First call should renew
        $result1 = MerchantCreditService::checkAndRenewSubscription($this->merchant);
        $this->assertTrue($result1);

        $firstRenewalTime = $this->merchant->fresh()->subscription_renewed_at;

        // Second call immediately after should not renew
        $result2 = MerchantCreditService::checkAndRenewSubscription($this->merchant);
        $this->assertFalse($result2);

        $secondRenewalTime = $this->merchant->fresh()->subscription_renewed_at;

        // Timestamp should be the same
        $this->assertEquals($firstRenewalTime->timestamp, $secondRenewalTime->timestamp);
    }

    #[Test]
    public function workflow_subscription_usage_renewal_more_usage(): void
    {
        // Month 1: Subscribe
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        $summary = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(500, $summary['total_credits']);

        // Month 1: Use credits
        MerchantCreditService::deductCredits($this->merchant, 200);
        $summary = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(300, $summary['total_credits']);

        // Month 1: Buy top-ups
        MerchantCreditService::addTopUpCredits($this->merchant, 100);
        $summary = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(400, $summary['total_credits']);

        // Month 2: Renewal happens
        $this->merchant->update([
            'subscription_renews_at' => now()->subMinute(),
        ]);
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summary = MerchantCreditService::getSummary($this->merchant);
        // Plan reset to 500, top-up preserved at 100
        $this->assertEquals(500, $summary['plan_cycle_remaining']);
        $this->assertEquals(100, $summary['top_up_credits']);
        $this->assertEquals(600, $summary['total_credits']);

        // Month 2: Use credits (plan + top-up)
        MerchantCreditService::deductCredits($this->merchant, 550);

        $summary = MerchantCreditService::getSummary($this->merchant);
        // Plan depleted, 50 from top-up used
        $this->assertEquals(0, $summary['plan_cycle_remaining']);
        $this->assertEquals(50, $summary['top_up_credits']);
        $this->assertEquals(50, $summary['total_credits']);

        // Month 2: Final check
        $this->merchant->update([
            'subscription_renews_at' => now()->subHour(),
        ]);
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summary = MerchantCreditService::getSummary($this->merchant);
        // Plan reset, top-up preserved
        $this->assertEquals(500, $summary['plan_cycle_remaining']);
        $this->assertEquals(50, $summary['top_up_credits']);
        $this->assertEquals(550, $summary['total_credits']);
    }
}
