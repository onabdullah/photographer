<?php

namespace App\Mail\Admin;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamUserCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $sentAt;

    public function __construct(
        public string $fromAddress,
        public ?string $fromName = null,
        public string $userName = '',
        public string $userEmail = '',
        public string $temporaryPassword = '',
        public string $customRoleName = '',
        ?string $sentAt = null,
    ) {
        $this->sentAt = $sentAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Your team account access — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.team-user-credentials',
        );
    }
}
