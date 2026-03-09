<?php

namespace App\Services;

use App\Mail\Shopify\CreditUsageThresholdMail;
use App\Models\Merchant;

class MerchantCreditThresholdNotifier
{
    private const SETTINGS_KEY = 'credit_alert_state';

    public static function notifyOnConsumption(Merchant $merchant, int $beforeBalance, int $afterBalance): void
    {
        if ($beforeBalance <= 0 || $afterBalance < 0 || $afterBalance >= $beforeBalance) {
            return;
        }

        $ownerEmail = mb_strtolower(trim((string) ($merchant->email ?? '')));
        if ($ownerEmail === '' || ! filter_var($ownerEmail, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            return;
        }

        $settings = is_array($merchant->app_settings) ? $merchant->app_settings : [];
        $state = is_array($settings[self::SETTINGS_KEY] ?? null) ? $settings[self::SETTINGS_KEY] : [];

        $existingBaseline = (int) ($state['baseline_credits'] ?? 0);
        $baseline = $existingBaseline > 0 ? $existingBaseline : $beforeBalance;

        // If merchant received a top-up/reset, treat current balance as a new cycle baseline.
        if ($beforeBalance > $baseline) {
            $baseline = $beforeBalance;
            $state['half_used_sent'] = false;
            $state['five_remaining_sent'] = false;
        }

        if ($baseline <= 0) {
            return;
        }

        $sentHalf = (bool) ($state['half_used_sent'] ?? false);
        $sentFive = (bool) ($state['five_remaining_sent'] ?? false);

        $halfBoundary = (int) floor($baseline * 0.5);
        $fiveBoundary = (int) floor($baseline * 0.05);

        $shouldSendHalf = ! $sentHalf && $beforeBalance > $halfBoundary && $afterBalance <= $halfBoundary;
        $shouldSendFive = ! $sentFive && $beforeBalance > $fiveBoundary && $afterBalance <= $fiveBoundary;

        if (! $shouldSendHalf && ! $shouldSendFive) {
            $state['baseline_credits'] = $baseline;
            self::persistState($merchant, $settings, $state);
            return;
        }

        if ($shouldSendHalf) {
            MailService::send(
                toAddress: $ownerEmail,
                mailable: new CreditUsageThresholdMail(
                    merchant: $merchant,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    baselineCredits: $baseline,
                    remainingCredits: $afterBalance,
                    thresholdKey: 'half_used',
                ),
                subject: 'You have used 50% of your credits — ' . ($merchant->store_name ?: $merchant->name),
            );
            $state['half_used_sent'] = true;
        }

        if ($shouldSendFive) {
            MailService::send(
                toAddress: $ownerEmail,
                mailable: new CreditUsageThresholdMail(
                    merchant: $merchant,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    baselineCredits: $baseline,
                    remainingCredits: $afterBalance,
                    thresholdKey: 'five_remaining',
                ),
                subject: 'Important: only 5% credits remaining — ' . ($merchant->store_name ?: $merchant->name),
            );
            $state['five_remaining_sent'] = true;
        }

        $state['baseline_credits'] = $baseline;
        self::persistState($merchant, $settings, $state);
    }

    private static function persistState(Merchant $merchant, array $settings, array $state): void
    {
        $settings[self::SETTINGS_KEY] = [
            'baseline_credits' => (int) ($state['baseline_credits'] ?? 0),
            'half_used_sent' => (bool) ($state['half_used_sent'] ?? false),
            'five_remaining_sent' => (bool) ($state['five_remaining_sent'] ?? false),
            'updated_at' => now()->toIso8601String(),
        ];

        $merchant->forceFill(['app_settings' => $settings])->save();
    }
}
