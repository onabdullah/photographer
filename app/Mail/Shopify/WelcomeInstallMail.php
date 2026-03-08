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

class WelcomeInstallMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $appName;
    public ?string $appLogoUrl;
    public string $shopName;
    public int $creditsGranted;

    public function __construct(
        public Merchant $merchant,
        public string $fromAddress,
        public ?string $fromName = null,
        int $creditsGranted = 5,
    ) {
        $this->appName       = SiteSetting::get(SiteSetting::KEY_APP_NAME, config('app.name')) ?? config('app.name');
        $this->appLogoUrl    = SiteSetting::getAppLogoUrl();
        $this->shopName      = $merchant->store_name ?: $merchant->shop_owner ?: $merchant->name;
        $this->creditsGranted = $creditsGranted;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? $this->appName),
            subject: 'Welcome to ' . $this->appName . ' — You\'re all set!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.welcome-install',
        );
    }
}
