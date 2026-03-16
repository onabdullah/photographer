<?php

namespace App\Mail\Shopify;

use App\Models\Merchant;
use App\Models\SiteSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class FirstCreationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $appName;
    public ?string $appLogoUrl;
    public string $shopName;
    public string $createdAt;
    public int $creditsRemaining;

    public function __construct(
        public Merchant $merchant,
        public string $toolName = 'AI Image Enhancement',
        public string $fromAddress = '',
        public ?string $fromName = null,
        int $creditsRemaining = 0,
        string $createdAt = '',
    ) {
        $this->appName           = SiteSetting::get(SiteSetting::KEY_APP_NAME, config('app.name')) ?? config('app.name');
        $this->appLogoUrl        = SiteSetting::getAppLogoUrl();
        $this->shopName          = $merchant->store_name ?: $merchant->shop_owner ?: $merchant->name;
        $this->creditsRemaining  = $creditsRemaining;
        $this->createdAt         = $createdAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress ?: config('mail.from.address'), $this->fromName ?? $this->appName),
            subject: 'Your first creation is complete - quality product visuals made simple',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.first-creation',
        );
    }
}
