<?php

namespace App\Console\Commands;

use App\Models\Merchant;
use App\Services\MerchantCreditService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RenewSubscriptionCreditsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'credits:renew-subscriptions {--dry-run : Preview changes without executing}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Renew subscription credits for merchants whose subscription cycles have ended. One-time top-up credits remain indefinite.';

    /**
     * Execute the console command.
     *
     * This command:
     * 1. Finds all merchants with active plans whose subscription_renews_at has passed
     * 2. Resets their plan_cycle_remaining to plan_cycle_credits
     * 3. Keeps their top_up_credits intact (one-time purchases valid indefinitely)
     * 4. Updates the subscription_renews_at timestamp for the next cycle
     *
     * Idempotent: Safe to run multiple times per day since renewal only happens once per cycle.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $now = now();

        $this->info($dryRun ? '[DRY RUN] ' : '' . "Checking for merchants needing subscription credit renewal...");

        // Find merchants with plans where subscription_renews_at has passed
        $merchants = Merchant::where('plan_id', '!=', null)
            ->where('subscription_renews_at', '<=', $now)
            ->get();

        if ($merchants->isEmpty()) {
            $this->info('No merchants need credit renewal at this time.');
            return self::SUCCESS;
        }

        $this->line("Found {$merchants->count()} merchant(s) needing renewal.");

        $renewed = 0;
        $failed = 0;

        foreach ($merchants as $merchant) {
            try {
                if (MerchantCreditService::needsSubscriptionRenewal($merchant)) {
                    if (! $dryRun) {
                        MerchantCreditService::renewSubscriptionCycle($merchant);

                        Log::info('Subscription credits renewed', [
                            'shop' => $merchant->name,
                            'plan' => $merchant->plan?->name ?? 'unknown',
                            'renewed_at' => $merchant->subscription_renewed_at?->toIso8601String(),
                            'next_renewal' => $merchant->subscription_renews_at?->toIso8601String(),
                        ]);
                    }

                    $summary = MerchantCreditService::getSummary($merchant);
                    $this->line(sprintf(
                        '  ✓ %s: %d plan credits + %d top-up (total: %d)',
                        $merchant->name,
                        $summary['plan_cycle_remaining'],
                        $summary['top_up_credits'],
                        $summary['total_credits']
                    ));

                    $renewed++;
                }
            } catch (\Exception $e) {
                $failed++;
                $this->error("  ✗ {$merchant->name}: " . $e->getMessage());
                Log::error('Failed to renew subscription credits', [
                    'shop' => $merchant->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->newLine();
        $this->info($dryRun ? '[DRY RUN] ' : '' . "Renewal complete: {$renewed} renewed, {$failed} failed.");

        if ($dryRun) {
            $this->line('No changes were made (dry run mode). Remove --dry-run to execute.');
        }

        return self::SUCCESS;
    }
}
