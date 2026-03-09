<?php

namespace App\Mail\Admin;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminActivityAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $occurredAt;

    public function __construct(
        public string $fromAddress,
        public ?string $fromName = null,
        public string $action = '',
        public string $actorName = 'System',
        public ?string $actorEmail = null,
        public array $details = [],
        ?string $occurredAt = null,
    ) {
        $this->occurredAt = $occurredAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Admin Activity Alert — ' . $this->action,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.admin-activity-alert',
        );
    }
}
