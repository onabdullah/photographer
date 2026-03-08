<?php

namespace App\Listeners;

use App\Mail\WelcomeInstallMail;
use App\Models\EmailLog;
use App\Models\Merchant;
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

        // Only grant credits on new install (when balance is 0 or null)
        $balance = $merchant->ai_credits_balance ?? 0;
        if ($balance <= 0) {
            $merchant->ai_credits_balance = self::DEFAULT_INSTALL_CREDITS;
            $merchant->save();
        }

        // Send welcome email if the merchant has an email address
        $recipientEmail = $merchant->email;
        if ($recipientEmail) {
            $smtp = MailService::resolveSmtp();
            if ($smtp) {
                $subject = 'Welcome to ' . config('app.name') . ' — You\'re all set!';
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
        }
    }
}
