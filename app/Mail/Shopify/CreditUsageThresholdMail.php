<?php

namespace App\Mail\Shopify;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CreditUsageThresholdMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $usedCredits;
    public float $usedPercent;
    public float $remainingPercent;
    public string $shopName;

    public function __construct(
        public Merchant $merchant,
        public string $fromAddress,
        public ?string $fromName = null,
        public int $baselineCredits = 0,
        public int $remainingCredits = 0,
        public string $thresholdKey = 'half_used',
    ) {
        $this->shopName = $merchant->store_name ?: $merchant->shop_owner ?: $merchant->name;
        $this->usedCredits = max(0, $baselineCredits - $remainingCredits);
        $this->usedPercent = $baselineCredits > 0 ? round(($this->usedCredits / $baselineCredits) * 100, 2) : 0;
        $this->remainingPercent = $baselineCredits > 0 ? round(($remainingCredits / $baselineCredits) * 100, 2) : 0;
    }

    public function envelope(): Envelope
    {
        $subject = $this->thresholdKey === 'five_remaining'
            ? 'Important: only 5% credits remaining — ' . $this->shopName
            : 'You have used 50% of your credits — ' . $this->shopName;

        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.credit-usage-threshold',
        );
    }
}
