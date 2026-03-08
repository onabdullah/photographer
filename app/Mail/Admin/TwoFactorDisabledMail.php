<?php

namespace App\Mail\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorDisabledMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $fromAddress,
        public ?string $fromName = null,
        public string $ip = 'Unknown',
        public string $disabledAt = '',
    ) {
        if (empty($this->disabledAt)) {
            $this->disabledAt = now()->format('D, d M Y · H:i T');
        }
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Two-Factor Authentication Disabled — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.two-factor-disabled',
        );
    }
}
