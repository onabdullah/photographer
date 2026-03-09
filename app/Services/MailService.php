<?php

namespace App\Services;

use App\Models\MailLog;
use App\Models\SmtpSetting;
use Illuminate\Mail\Mailable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class MailService
{
    /**
     * Resolve the best active SMTP setting.
     * Priority: general → support → marketing
     */
    public static function resolveSmtp(): ?SmtpSetting
    {
        return SmtpSetting::activeForPurpose(SmtpSetting::PURPOSE_GENERAL)
            ?? SmtpSetting::activeForPurpose(SmtpSetting::PURPOSE_SUPPORT)
            ?? SmtpSetting::activeForPurpose(SmtpSetting::PURPOSE_MARKETING);
    }

    /**
     * Send a Mailable using the resolved SMTP setting and log the result.
     *
     * Returns true on success, false if no SMTP is configured or sending fails.
     */
    public static function send(string $toAddress, Mailable $mailable, string $subject): bool
    {
        $smtp = self::resolveSmtp();

        if (! $smtp) {
            Log::channel('mail')->warning('No active SMTP setting found — email not sent.', [
                'to'      => $toAddress,
                'subject' => $subject,
            ]);
            return false;
        }

        $mailerName = 'dynamic_smtp_' . $smtp->id;

        Config::set("mail.mailers.{$mailerName}", [
            'transport'  => 'smtp',
            'host'       => $smtp->host,
            'port'       => (int) $smtp->port,
            'encryption' => $smtp->encryption,
            'username'   => $smtp->username,
            'password'   => $smtp->password,
            'timeout'    => null,
        ]);

        $start = microtime(true);

        try {
            Mail::mailer($mailerName)
                ->to($toAddress)
                ->send($mailable);

            MailLog::create([
                'smtp_setting_id' => $smtp->id,
                'to_address'      => $toAddress,
                'subject'         => $subject,
                'status'          => MailLog::STATUS_SENT,
                'duration_ms'     => (int) round((microtime(true) - $start) * 1000),
                'error_message'   => null,
                'sent_at'         => now(),
            ]);

            return true;
        } catch (\Throwable $e) {
            MailLog::create([
                'smtp_setting_id' => $smtp->id,
                'to_address'      => $toAddress,
                'subject'         => $subject,
                'status'          => MailLog::STATUS_FAILED,
                'duration_ms'     => (int) round((microtime(true) - $start) * 1000),
                'error_message'   => $e->getMessage(),
                'sent_at'         => now(),
            ]);

            return false;
        }
    }
}
