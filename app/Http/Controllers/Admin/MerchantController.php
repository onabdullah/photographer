<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Admin\MerchantCreditsUpdatedMail;
use App\Mail\Shopify\MerchantCreditsUpdatedOwnerMail;
use App\Models\Merchant;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MerchantController extends Controller
{
    public function updateCredits(Request $request, string $id)
    {
        $request->validate([
            'ai_credits_balance' => 'required|integer|min:0',
        ]);

        $merchant = Merchant::findOrFail($id);
        $previousCredits = (int) ($merchant->ai_credits_balance ?? 0);
        $newCredits = (int) $request->input('ai_credits_balance');
        $merchant->ai_credits_balance = $newCredits;
        $merchant->save();

        $notifiedRecipients = $this->notifySuperAdminsOfCreditUpdate($request, $merchant, $previousCredits, $newCredits);
        $this->notifyStoreOwnerOfCreditUpdate($merchant, $previousCredits, $newCredits, $notifiedRecipients);

        return redirect()->back()->with('success', 'Credits updated.');
    }

    /**
     * Notify super-admin operators when merchant credits are updated manually.
     */
    private function notifySuperAdminsOfCreditUpdate(Request $request, Merchant $merchant, int $previousCredits, int $newCredits): array
    {
        $notifiedRecipients = [];

        if ($previousCredits === $newCredits) {
            return $notifiedRecipients;
        }

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            Log::channel('mail')->warning('Skipping credit update notification: no active SMTP setting.', [
                'merchant_id' => $merchant->id,
                'merchant' => $merchant->name,
            ]);
            return $notifiedRecipients;
        }

        $editor = $request->user('admin') ?? $request->user();
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
            Log::channel('mail')->warning('Skipping credit update notification: no super-admin recipients found.', [
                'merchant_id' => $merchant->id,
                'merchant' => $merchant->name,
            ]);
            return $notifiedRecipients;
        }

        $subject = 'Merchant credits updated — ' . ($merchant->store_name ?: $merchant->name);
        $changedAt = now()->format('D, d M Y · H:i T');

        foreach ($superAdmins as $recipient) {
            $notifiedRecipients[] = mb_strtolower(trim((string) $recipient->email));

            MailService::send(
                toAddress: $recipient->email,
                mailable: new MerchantCreditsUpdatedMail(
                    merchant: $merchant,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    previousCredits: $previousCredits,
                    newCredits: $newCredits,
                    changedByName: $editor?->name ?? 'System',
                    changedByEmail: $editor?->email,
                    changedAt: $changedAt,
                ),
                subject: $subject,
            );
        }

        return array_values(array_unique($notifiedRecipients));
    }

    /**
     * Notify the merchant owner about credit updates using a customer-facing template.
     * Skips if owner email is empty/invalid or already notified as an admin recipient.
     */
    private function notifyStoreOwnerOfCreditUpdate(Merchant $merchant, int $previousCredits, int $newCredits, array $alreadyNotified = []): void
    {
        if ($previousCredits === $newCredits) {
            return;
        }

        $ownerEmail = mb_strtolower(trim((string) ($merchant->email ?? '')));
        if ($ownerEmail === '' || ! filter_var($ownerEmail, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        if (in_array($ownerEmail, $alreadyNotified, true)) {
            return;
        }

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            return;
        }

        MailService::send(
            toAddress: $ownerEmail,
            mailable: new MerchantCreditsUpdatedOwnerMail(
                merchant: $merchant,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                previousCredits: $previousCredits,
                newCredits: $newCredits,
                changedAt: now()->format('D, d M Y · H:i T'),
            ),
            subject: 'Your store credits were updated — ' . ($merchant->store_name ?: $merchant->name),
        );
    }
}
