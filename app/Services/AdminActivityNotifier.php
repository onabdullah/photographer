<?php

namespace App\Services;

use App\Mail\Admin\AdminActivityAlertMail;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AdminActivityNotifier
{
    /**
     * Notify super-admin operators about a sensitive admin activity.
     */
    public static function notify(string $action, string $actorName, ?string $actorEmail = null, array $details = []): void
    {
        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            Log::channel('mail')->warning('Skipping admin activity alert: no active SMTP setting.', [
                'action' => $action,
            ]);
            return;
        }

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
            Log::channel('mail')->warning('Skipping admin activity alert: no super-admin recipients found.', [
                'action' => $action,
            ]);
            return;
        }

        foreach ($superAdmins as $recipient) {
            MailService::queue(
                toAddress: $recipient->email,
                mailable: new AdminActivityAlertMail(
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    action: $action,
                    actorName: $actorName,
                    actorEmail: $actorEmail,
                    details: $details,
                ),
                subject: 'Admin Activity Alert — ' . $action,
            );
        }
    }
}
