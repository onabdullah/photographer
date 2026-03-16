<?php

namespace App\Listeners;

use App\Mail\Admin\PlanSubscribedAdminMail;
use App\Mail\Shopify\PlanSubscribedMerchantMail;
use App\Models\Merchant;
use App\Models\Plan;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Support\Facades\Log;
use Osiset\ShopifyApp\Messaging\Events\PlanActivatedEvent;

class SendPlanSubscribedEmails
{
    public function handle(PlanActivatedEvent $event): void
    {
        /** @var Merchant $merchant */
        $merchant = $event->shop;

        /** @var Plan|null $plan */
        $plan = $event->plan ?? ($merchant->plan ?? null);

        if (! $plan) {
            Log::channel('mail')->warning('SendPlanSubscribedEmails: plan not found', [
                'shop' => $merchant->name ?? 'unknown',
            ]);
            return;
        }

        $chargeId    = $event->chargeId?->toNative() ?? '';
        $subscribedAt = now()->format('D, d M Y · H:i T');

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            Log::channel('mail')->warning('SendPlanSubscribedEmails: no active SMTP', [
                'shop' => $merchant->name,
                'plan' => $plan->name,
            ]);
            return;
        }

        // ── 1. Notify all super-admins ──────────────────────────────────────
        $superAdmins = User::query()
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where(function ($q) {
                $q->where('role', 'super_admin')
                  ->orWhereHas('adminRole', function ($rq) {
                      $rq->whereJsonContains('permissions', '*')
                         ->orWhereJsonContains('permissions', 'settings.smtp');
                  });
            })
            ->get();

        $notifiedAdmins = [];
        foreach ($superAdmins as $admin) {
            $notifiedAdmins[] = mb_strtolower(trim((string) $admin->email));
            MailService::queue(
                toAddress: $admin->email,
                mailable: new PlanSubscribedAdminMail(
                    merchant: $merchant,
                    plan: $plan,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    chargeId: (string) $chargeId,
                    subscribedAt: $subscribedAt,
                ),
                subject: '[Plan Subscribed] ' . $merchant->name . ' → ' . $plan->name,
            );
        }

        // ── 2. Notify the store owner ──────────────────────────────────────
        $ownerEmail = mb_strtolower(trim((string) ($merchant->email ?? '')));
        if ($ownerEmail === '' || ! filter_var($ownerEmail, FILTER_VALIDATE_EMAIL)) {
            return;
        }
        if (in_array($ownerEmail, $notifiedAdmins, true)) {
            return;
        }

        MailService::queue(
            toAddress: $ownerEmail,
            mailable: new PlanSubscribedMerchantMail(
                merchant: $merchant,
                plan: $plan,
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                subscribedAt: $subscribedAt,
            ),
            subject: 'You\'re now on the ' . $plan->name . ' — ' . config('app.name'),
        );
    }
}
