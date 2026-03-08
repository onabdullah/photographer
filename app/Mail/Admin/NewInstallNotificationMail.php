<?php

namespace App\Mail\Admin;

use App\Models\Merchant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewInstallNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $shopDomain;
    public string $shopName;
    public string $ownerName;
    public ?string $country;
    public ?string $merchantEmail;
    public int $creditsGranted;
    public bool $isReinstall;
    public string $installedAt;

    public function __construct(
        public Merchant $merchant,
        public string $fromAddress,
        public ?string $fromName = null,
        int $creditsGranted = 0,
        bool $isReinstall = false,
        string $installedAt = '',
    ) {
        $this->shopDomain    = $merchant->name;
        $this->shopName      = $merchant->store_name ?: $merchant->name;
        $this->ownerName     = $merchant->shop_owner ?: 'N/A';
        $this->country       = $merchant->country ?: null;
        $this->merchantEmail = $merchant->email ?: null;
        $this->creditsGranted = $creditsGranted;
        $this->isReinstall   = $isReinstall;
        $this->installedAt   = $installedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        $type = $this->isReinstall ? 'Reinstall' : 'New Install';

        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: '[' . $type . '] ' . $this->shopDomain . ' — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.new-install-notification',
        );
    }
}
