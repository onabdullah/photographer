<?php

namespace App\Console\Commands;

use App\Jobs\SyncShopDetails;
use App\Models\Merchant;
use Illuminate\Console\Command;

class SyncMerchantShopDetailsCommand extends Command
{
    protected $signature = 'merchants:sync-shop-details
                            {--all : Sync all merchants}
                            {--missing : Only sync merchants with missing store_name or shop_owner}';

    protected $description = 'Fetch and store exact store name and owner from Shopify for merchants (runs SyncShopDetails job).';

    public function handle(): int
    {
        $query = Merchant::query();

        if ($this->option('missing')) {
            $query->where(function ($q) {
                $q->whereNull('store_name')->orWhereNull('shop_owner');
            });
        } elseif (! $this->option('all')) {
            $this->error('Use --all to sync all merchants or --missing to sync only those with missing store_name/shop_owner.');
            return self::FAILURE;
        }

        $merchants = $query->get();
        if ($merchants->isEmpty()) {
            $this->info('No merchants to sync.');
            return self::SUCCESS;
        }

        $this->info("Syncing shop details for {$merchants->count()} merchant(s)...");

        $bar = $this->output->createProgressBar($merchants->count());
        $bar->start();

        foreach ($merchants as $merchant) {
            try {
                SyncShopDetails::dispatchSync($merchant);
            } catch (\Throwable $e) {
                $this->newLine();
                $this->warn("Failed for {$merchant->name}: " . $e->getMessage());
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $this->info('Done.');

        return self::SUCCESS;
    }
}
