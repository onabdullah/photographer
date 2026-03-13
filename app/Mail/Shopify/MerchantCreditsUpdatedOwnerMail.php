<?php

namespace App\Mail\Shopify;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MerchantCreditsUpdatedOwnerMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $shopName;
    public int $creditDelta;
    public string $changedAt;

    public function __construct(
        public Merchant $merchant,
        public string $fromAddress,
        public ?string $fromName = null,
        public int $previousCredits = 0,
        public int $newCredits = 0,
        string $changedAt = '',
    ) {
        $this->shopName = $merchant->store_name ?: $merchant->name;
        $this->creditDelta = $newCredits - $previousCredits;
        $this->changedAt = $changedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Thank you - your store credits are ready to use for ' . $this->shopName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.merchant-credits-updated-owner',
        );
    }
}
