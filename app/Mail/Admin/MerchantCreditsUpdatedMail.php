<?php

namespace App\Mail\Admin;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MerchantCreditsUpdatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $shopDomain;
    public string $shopName;
    public int $creditDelta;
    public string $changedAt;

    public function __construct(
        public Merchant $merchant,
        public string $fromAddress,
        public ?string $fromName = null,
        public int $previousCredits = 0,
        public int $newCredits = 0,
        public string $changedByName = 'System',
        public ?string $changedByEmail = null,
        string $changedAt = '',
    ) {
        $this->shopDomain = $merchant->name;
        $this->shopName = $merchant->store_name ?: $merchant->name;
        $this->creditDelta = $newCredits - $previousCredits;
        $this->changedAt = $changedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Merchant credits updated — ' . $this->shopName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.merchant-credits-updated',
        );
    }
}
