<?php

namespace App\Listeners;

use App\Mail\Admin\NewInstallNotificationMail;
use App\Mail\Shopify\WelcomeInstallMail;
use App\Models\EmailLog;
use App\Models\Merchant;
use App\Models\User;
use App\Services\MailService;
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

        $merchant = Merchant::find($merchantId);
        if (! $merchant) {
            return;
        }

        // Determine if this is a reinstall (existing balance > 0)
        $balance      = $merchant->ai_credits_balance ?? 0;
        $isReinstall  = $balance > 0;
        $creditsGranted = 0;

        // Only grant credits on new install (when balance is 0 or null)
        if (! $isReinstall) {
            $merchant->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $merchant->save();
            $creditsGranted = self::DEFAULT_INSTALL_CREDITS;
        }

        $smtp = MailService::resolveSmtp();

        // ── Send welcome email to the store owner ──────────────────────
        $recipientEmail = $merchant->email;
        if ($recipientEmail && $smtp) {
            $subject  = 'Welcome to ' . config('app.name') . ' — You\'re all set!';
            $mailable = new WelcomeInstallMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                creditsGranted: self::DEFAULT_INSTALL_CREDITS,
            );

            MailService::send($recipientEmail, $mailable, $subject);

            EmailLog::create([
                'merchant_id'   => $merchant->id,
                'sent_to_email' => $recipientEmail,
                'email_type'    => 'welcome_install',
            ]);
        }

        // ── Notify all super admins of the new / reinstall ─────────────
        if ($smtp) {
            $superAdmins = User::where('role', 'super_admin')
                ->where('status', 'active')
                ->whereNotNull('email')
                ->get();

            $installedAt = now()->format('D, d M Y · H:i T');

            foreach ($superAdmins as $admin) {
                $subject  = ($isReinstall ? '[Reinstall] ' : '[New Install] ')
                    . $merchant->name . ' — ' . config('app.name');

                MailService::send($admin->email, new NewInstallNotificationMail(
                    merchant: $merchant,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    creditsGranted: $creditsGranted,
                    isReinstall: $isReinstall,
                    installedAt: $installedAt,
                ), $subject);
            }
        }
    }
}
