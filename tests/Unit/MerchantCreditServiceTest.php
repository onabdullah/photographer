<?php

namespace Tests\Unit;

use App\Models\Merchant;
use App\Models\Plan;
use App\Services\MerchantCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class MerchantCreditServiceTest extends TestCase
{
    use RefreshDatabase;

    private Merchant $merchant;
    private Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test plan
        $this->plan = Plan::create([
            'name' => 'Pro',
            'type' => 'RECURRING',
            'price' => 19.99,
            'trial_days' => 0,
            'monthly_credits' => 500,
            'on_install' => false,
            'test' => false,
        ]);

        // Create a test merchant
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
    public function subscription_cycle_starts_with_correct_dates(): void
    {
        $before = now();

        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $this->merchant->refresh();

        $this->assertNotNull($this->merchant->subscription_cycle_started_at);
        $this->assertNotNull($this->merchant->subscription_renewed_at);
        $this->assertNotNull($this->merchant->subscription_renews_at);

        // Verify order of dates
        $this->assertLessThanOrEqual($this->merchant->subscription_cycle_started_at, $before);
        $this->assertEquals(
            $this->merchant->subscription_cycle_started_at,
            $this->merchant->subscription_renewed_at
        );

        // Verify renewal is 1 month in the future
        $expectedRenewal = $this->merchant->subscription_cycle_started_at->clone()->addMonth();
        $this->assertEquals(
            $expectedRenewal->format('Y-m-d H'),
            $this->merchant->subscription_renews_at->format('Y-m-d H')
        );
    }

    #[Test]
    public function subscription_started_with_full_plan_credits(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $summary = MerchantCreditService::getSummary($this->merchant);

        $this->assertEquals(500, $summary['plan_cycle_credits']);
        $this->assertEquals(500, $summary['plan_cycle_remaining']);
        $this->assertEquals(0, $summary['top_up_credits']);
        $this->assertEquals(500, $summary['total_credits']);
    }

    #[Test]
    public function subscription_cycle_preserves_existing_topup_credits(): void
    {
        // First, add some top-up credits
        MerchantCreditService::addTopUpCredits($this->merchant, 250);

        // Then start subscription cycle
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $summary = MerchantCreditService::getSummary($this->merchant);

        // Top-up credits should be preserved
        $this->assertEquals(250, $summary['top_up_credits']);
        // Plan credits should be set
        $this->assertEquals(500, $summary['plan_cycle_credits']);
        // Total should be both
        $this->assertEquals(750, $summary['total_credits']);
    }

    #[Test]
    public function plan_credits_deducted_before_topup_credits(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        // Deduct 300 credits (less than plan remaining)
        MerchantCreditService::deductCredits($this->merchant, 300);

        $summary = MerchantCreditService::getSummary($this->merchant);

        $this->assertEquals(200, $summary['plan_cycle_remaining']);
        $this->assertEquals(100, $summary['top_up_credits']); // Untouched
    }

    #[Test]
    public function topup_credits_used_when_plan_depleted(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        // Deduct more than plan remaining
        MerchantCreditService::deductCredits($this->merchant, 550);

        $summary = MerchantCreditService::getSummary($this->merchant);

        $this->assertEquals(0, $summary['plan_cycle_remaining']);
        $this->assertEquals(50, $summary['top_up_credits']); // 100 - 50 used
    }

    #[Test]
    public function renewal_resets_plan_credits(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        // Use some credits
        MerchantCreditService::deductCredits($this->merchant, 200);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(300, $summaryBefore['plan_cycle_remaining']);

        // Now renew
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Plan credits should be refreshed
        $this->assertEquals(500, $summaryAfter['plan_cycle_remaining']);
        $this->assertEquals(500, $summaryAfter['plan_cycle_credits']);
    }

    #[Test]
    public function renewal_preserves_topup_credits(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 250);

        // Use some credits
        MerchantCreditService::deductCredits($this->merchant, 100);
        MerchantCreditService::deductCredits($this->merchant, 50);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(250, $summaryBefore['top_up_credits']);

        // Renew subscription
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Top-up credits should be exactly the same (indefinite)
        $this->assertEquals(250, $summaryAfter['top_up_credits']);
    }

    #[Test]
    public function renewal_updates_renewal_dates(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $oldRenewsAt = $this->merchant->subscription_renews_at;

        // Wait a bit and renew
        sleep(1);
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $this->merchant->refresh();

        // subscription_renewed_at should be updated to now
        $this->assertGreaterThan(
            $oldRenewsAt,
            $this->merchant->subscription_renewed_at
        );

        // Next renewal should be approximately 1 month from renewed_at
        $expectedNextRenewal = $this->merchant->subscription_renewed_at->clone()->addMonth();
        $this->assertEquals(
            $expectedNextRenewal->format('Y-m-d H'),
            $this->merchant->subscription_renews_at->format('Y-m-d H')
        );
    }

    #[Test]
    public function needs_subscription_renewal_detects_past_dates(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        // Initially should not need renewal
        $this->assertFalse(MerchantCreditService::needsSubscriptionRenewal($this->merchant));

        // Move renewal date to past
        $this->merchant->update([
            'subscription_renews_at' => now()->subDay(),
        ]);

        // Now should need renewal
        $this->assertTrue(MerchantCreditService::needsSubscriptionRenewal($this->merchant));
    }

    #[Test]
    public function needs_subscription_renewal_returns_false_without_plan(): void
    {
        $merchantWithoutPlan = Merchant::create([
            'name' => 'no-plan.myshopify.com',
            'email' => 'no-plan@example.com',
            'password' => 'hashed',
            'ai_credits_balance' => 0,
        ]);

        $this->assertFalse(MerchantCreditService::needsSubscriptionRenewal($merchantWithoutPlan));
    }

    #[Test]
    public function check_and_renew_subscription_is_idempotent(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        // Move past renewal date
        $this->merchant->update([
            'subscription_renews_at' => now()->subHour(),
        ]);

        // First renewal should succeed
        $result1 = MerchantCreditService::checkAndRenewSubscription($this->merchant);
        $this->assertTrue($result1);

        $firstRenewalAt = $this->merchant->fresh()->subscription_renewed_at;

        // Second call shortly after should return false (renewal already done)
        $result2 = MerchantCreditService::checkAndRenewSubscription($this->merchant);
        $this->assertFalse($result2);

        $secondRenewalAt = $this->merchant->fresh()->subscription_renewed_at;

        // Timestamp should be the same (no re-renewal)
        $this->assertEquals(
            $firstRenewalAt->getTimestamp(),
            $secondRenewalAt->getTimestamp()
        );
    }

    #[Test]
    public function adding_topup_credits_works_independently(): void
    {
        // Can add top-up credits even without subscription active
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        $summary1 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(100, $summary1['top_up_credits']);

        // Add more
        MerchantCreditService::addTopUpCredits($this->merchant, 50);

        $summary2 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(150, $summary2['top_up_credits']);
    }

    #[Test]
    public function zero_credits_deduction_is_safe(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);

        MerchantCreditService::deductCredits($this->merchant, 0);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Should be unchanged
        $this->assertEquals($summaryBefore['plan_cycle_remaining'], $summaryAfter['plan_cycle_remaining']);
        $this->assertEquals($summaryBefore['top_up_credits'], $summaryAfter['top_up_credits']);
    }

    #[Test]
    public function exceeding_total_credits_deduction_clamps_to_zero(): void
    {
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        $summaryBefore = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(600, $summaryBefore['total_credits']);

        // Try to deduct more than total
        MerchantCreditService::deductCredits($this->merchant, 1000);

        $summaryAfter = MerchantCreditService::getSummary($this->merchant);

        // Should be zero for both
        $this->assertEquals(0, $summaryAfter['plan_cycle_remaining']);
        $this->assertEquals(0, $summaryAfter['top_up_credits']);
        $this->assertEquals(0, $summaryAfter['total_credits']);
    }

    #[Test]
    public function full_workflow_subscription_activation_usage_renewal(): void
    {
        // Step 1: User subscribes
        MerchantCreditService::startSubscriptionCycle($this->merchant, $this->plan);

        $step1 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(500, $step1['total_credits']);

        // Step 2: User uses credits
        MerchantCreditService::deductCredits($this->merchant, 200);

        $step2 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(300, $step2['total_credits']);

        // Step 3: User buys top-ups
        MerchantCreditService::addTopUpCredits($this->merchant, 100);

        $step3 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(400, $step3['total_credits']);

        // Step 4: Month ends - subscription renews
        MerchantCreditService::renewSubscriptionCycle($this->merchant);

        $step4 = MerchantCreditService::getSummary($this->merchant);
        // Plan credits fully restored, top-up preserved
        $this->assertEquals(500, $step4['plan_cycle_remaining']);
        $this->assertEquals(100, $step4['top_up_credits']);
        $this->assertEquals(600, $step4['total_credits']);

        // Step 5: User uses all plan credits + some top-up
        MerchantCreditService::deductCredits($this->merchant, 550);

        $step5 = MerchantCreditService::getSummary($this->merchant);
        $this->assertEquals(0, $step5['plan_cycle_remaining']);
        $this->assertEquals(50, $step5['top_up_credits']);
        $this->assertEquals(50, $step5['total_credits']);
    }
}
