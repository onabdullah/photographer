<?php

namespace App\Listeners;

use App\Jobs\SyncShopDetails;
use App\Mail\Admin\NewInstallNotificationMail;
use App\Mail\Shopify\WelcomeInstallMail;
use App\Models\EmailLog;
use App\Models\Merchant;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Messaging\Events\AppInstalledEvent;

class GrantCreditsOnInstall
{
    /**
     * Default credits for new installs.
     */
    protected const DEFAULT_INSTALL_CREDITS = 5;

    /**
     * Handle the event.
     */
    public function handle(AppInstalledEvent $event): void
    {
        $merchantId = $event->shopId->toNative();

        Log::channel('install')->info('Fired', ['merchant_id' => $merchantId]);

        $merchant = Merchant::find($merchantId);
        if (! $merchant) {
            Log::channel('install')->warning('Merchant not found', ['merchant_id' => $merchantId]);
            return;
        }

        // Ensure we have fresh store details from Shopify before sending any
        // emails. store_name, shop_owner, country and email are populated by
        // SyncShopDetails (GET /admin/shop.json). If they are not yet filled
        // (AppInstalledEvent can fire before after_authenticate_job completes),
        // we sync synchronously right here so both emails have accurate data.
        if (empty($merchant->store_name) || empty($merchant->email)) {
            try {
                Log::channel('install')->info('Syncing shop details before email dispatch', ['shop' => $merchant->name]);
                SyncShopDetails::dispatchSync($merchant);
                $merchant->refresh();
                Log::channel('install')->info('Shop details synced', [
                    'shop'       => $merchant->name,
                    'store_name' => $merchant->store_name,
                    'email'      => $merchant->email,
                ]);
            } catch (\Throwable $e) {
                Log::channel('install')->error('SyncShopDetails failed — emails will send with partial data', [
                    'shop'  => $merchant->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Determine if this is a reinstall (existing balance > 0)
        $balance        = $merchant->ai_credits_balance ?? 0;
        $isReinstall    = $balance > 0;
        $creditsGranted = 0;

        // Only grant credits on new install (when balance is 0 or null)
        if (! $isReinstall) {
            $merchant->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $merchant->save();
            $creditsGranted = self::DEFAULT_INSTALL_CREDITS;
            Log::channel('install')->info('Credits granted', [
                'shop'    => $merchant->name,
                'credits' => $creditsGranted,
            ]);
        } else {
            Log::channel('install')->info('Reinstall — no credits granted', [
                'shop'    => $merchant->name,
                'balance' => $balance,
            ]);
        }

        $smtp = MailService::resolveSmtp();

        if (! $smtp) {
            Log::channel('install')->warning('No active SMTP setting — skipping all emails', [
                'shop' => $merchant->name,
            ]);
            return;
        }

        // ── Send welcome email to the store owner ──────────────────────
        $recipientEmail = $merchant->email;
        if ($recipientEmail) {
            $subject  = 'Welcome to ' . config('app.name') . ' — You\'re all set!';
            $mailable = new WelcomeInstallMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                creditsGranted: self::DEFAULT_INSTALL_CREDITS,
            );

            $sent = MailService::send($recipientEmail, $mailable, $subject);

            Log::channel('install')->info('Welcome email ' . ($sent ? 'sent' : 'FAILED'), [
                'shop' => $merchant->name,
                'to'   => $recipientEmail,
            ]);

            if ($sent) {
                EmailLog::create([
                    'merchant_id'   => $merchant->id,
                    'sent_to_email' => $recipientEmail,
                    'email_type'    => 'welcome_install',
                ]);
            }
        } else {
            Log::channel('install')->warning('Merchant has no email — welcome email skipped', [
                'shop' => $merchant->name,
            ]);
        }

        // ── Notify admin operators of the new / reinstall ──────────────
        // Support both legacy role-based super_admin users and the newer
        // role table users that have wildcard permissions.
        $superAdmins = User::query()
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where(function ($q) {
                $q->where('role', 'super_admin')
                    ->orWhereHas('adminRole', function ($roleQ) {
                        $roleQ->whereJsonContains('permissions', '*')
                            ->orWhereJsonContains('permissions', 'settings.smtp');
                    });
            })
            ->get();

        if ($superAdmins->isEmpty()) {
            Log::channel('install')->warning('No active super_admin users found — admin notification skipped', [
                'shop' => $merchant->name,
            ]);
            return;
        }

        Log::channel('install')->info('Admin notification recipients resolved', [
            'shop' => $merchant->name,
            'count' => $superAdmins->count(),
            'emails' => $superAdmins->pluck('email')->values()->all(),
        ]);

        $installedAt = now()->format('D, d M Y · H:i T');

        foreach ($superAdmins as $admin) {
            $subject = ($isReinstall ? '[Reinstall] ' : '[New Install] ')
                . $merchant->name . ' — ' . config('app.name');

            $sent = MailService::send($admin->email, new NewInstallNotificationMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                creditsGranted: $creditsGranted,
                isReinstall: $isReinstall,
                installedAt: $installedAt,
            ), $subject);

            Log::channel('install')->info('Admin notification ' . ($sent ? 'sent' : 'FAILED'), [
                'shop'  => $merchant->name,
                'admin' => $admin->email,
            ]);
        }
    }
}
