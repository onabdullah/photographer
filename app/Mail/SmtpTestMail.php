<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SmtpTestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $purpose,
        public string $fromAddress,
        public ?string $fromName = null
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? ''),
            subject: 'SMTP test – ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.smtp-test',
        );
    }
}
