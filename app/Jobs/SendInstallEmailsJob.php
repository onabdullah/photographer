<?php

namespace App\Jobs;

use App\Mail\Admin\NewInstallNotificationMail;
use App\Mail\Shopify\WelcomeInstallMail;
use App\Models\EmailLog;
use App\Models\Merchant;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendInstallEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;

    public function __construct(
        protected int $merchantId,
        protected int $creditsGranted,
        protected bool $isReinstall,
    ) {}

    public function handle(): void
    {
        $merchant = Merchant::find($this->merchantId);
        if (! $merchant) {
            Log::channel('install')->warning('SendInstallEmailsJob: merchant not found', ['merchant_id' => $this->merchantId]);
            return;
        }

        // If shop details still missing (edge case), sync now — inside the job, non-blocking for the user.
        if (empty($merchant->store_name) || empty($merchant->email)) {
            try {
                SyncShopDetails::dispatchSync($merchant);
                $merchant->refresh();
            } catch (\Throwable $e) {
                Log::channel('install')->warning('SendInstallEmailsJob: sync failed, sending emails with partial data', [
                    'shop'  => $merchant->name,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            Log::channel('install')->warning('SendInstallEmailsJob: no active SMTP — emails skipped', ['shop' => $merchant->name]);
            return;
        }

        // Welcome email to the store owner
        if ($merchant->email) {
            $subject  = 'Welcome to ' . config('app.name') . ' — You\'re all set!';
            $mailable = new WelcomeInstallMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                creditsGranted: $this->creditsGranted > 0 ? $this->creditsGranted : 5,
            );

            $sent = MailService::send($merchant->email, $mailable, $subject);

            Log::channel('install')->info('Welcome email ' . ($sent ? 'sent' : 'FAILED'), [
                'shop' => $merchant->name,
                'to'   => $merchant->email,
            ]);

            if ($sent) {
                EmailLog::create([
                    'merchant_id'   => $merchant->id,
                    'sent_to_email' => $merchant->email,
                    'email_type'    => 'welcome_install',
                ]);
            }
        }

        // Admin notifications
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
            Log::channel('install')->warning('SendInstallEmailsJob: no admin users — notification skipped', ['shop' => $merchant->name]);
            return;
        }

        $installedAt = now()->format('D, d M Y · H:i T');

        foreach ($superAdmins as $admin) {
            $subject = ($this->isReinstall ? '[Reinstall] ' : '[New Install] ')
                . $merchant->name . ' — ' . config('app.name');

            MailService::send($admin->email, new NewInstallNotificationMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                creditsGranted: $this->creditsGranted,
                isReinstall: $this->isReinstall,
                installedAt: $installedAt,
            ), $subject);
        }
    }
}
