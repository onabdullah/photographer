<?php

namespace App\Mail\Admin;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TeamUserCreatedNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $createdAt;

    public function __construct(
        public string $fromAddress,
        public ?string $fromName = null,
        public string $createdUserName = '',
        public string $createdUserEmail = '',
        public string $createdUserStatus = 'active',
        public string $customRoleName = '',
        public string $createdByName = 'System',
        public ?string $createdByEmail = null,
        ?string $createdAt = null,
    ) {
        $this->createdAt = $createdAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Team user created — ' . $this->createdUserName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.team-user-created-notification',
        );
    }
}
