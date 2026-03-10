<?php

namespace App\Mail\Shopify;

use App\Models\Merchant;
use App\Models\Plan;
use App\Models\SiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PlanSubscribedMerchantMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $appName;
    public ?string $appLogoUrl;
    public string $shopName;
    public string $planName;
    public string $planPrice;
    public int $planCredits;
    public int $trialDays;
    public string $subscribedAt;

    public function __construct(
        public Merchant $merchant,
        public Plan $plan,
        public string $fromAddress,
        public ?string $fromName = null,
        string $subscribedAt = '',
    ) {
        $this->appName      = SiteSetting::get(SiteSetting::KEY_APP_NAME, config('app.name')) ?? config('app.name');
        $this->appLogoUrl   = SiteSetting::getAppLogoUrl();
        $this->shopName     = $merchant->store_name ?: $merchant->shop_owner ?: $merchant->name;
        $this->planName     = $plan->name;
        $this->planPrice    = number_format((float) $plan->price, 2);
        $this->planCredits  = (int) ($plan->monthly_credits ?? 0);
        $this->trialDays    = (int) ($plan->trial_days ?? 0);
        $this->subscribedAt = $subscribedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? $this->appName),
            subject: 'You\'re now on the ' . $this->planName . ' — ' . $this->appName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.plan-subscribed',
        );
    }
}
