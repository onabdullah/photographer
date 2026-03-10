<?php

namespace App\Mail\Admin;

use App\Models\Merchant;
use App\Models\Plan;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PlanSubscribedAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $shopDomain;
    public string $shopName;
    public ?string $ownerName;
    public ?string $merchantEmail;
    public string $planName;
    public string $planPrice;
    public int $planCredits;
    public string $subscribedAt;
    public string $chargeId;

    public function __construct(
        public Merchant $merchant,
        public Plan $plan,
        public string $fromAddress,
        public ?string $fromName = null,
        string $chargeId = '',
        string $subscribedAt = '',
    ) {
        $this->shopDomain    = $merchant->name;
        $this->shopName      = $merchant->store_name ?: $merchant->name;
        $this->ownerName     = $merchant->shop_owner ?: null;
        $this->merchantEmail = $merchant->email ?: null;
        $this->planName      = $plan->name;
        $this->planPrice     = number_format((float) $plan->price, 2);
        $this->planCredits   = (int) ($plan->monthly_credits ?? 0);
        $this->chargeId      = $chargeId;
        $this->subscribedAt  = $subscribedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: '[Plan Subscribed] ' . $this->shopDomain . ' → ' . $this->planName . ' — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.plan-subscribed',
        );
    }
}
