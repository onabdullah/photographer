<?php

namespace App\Mail\Shopify;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent when a large export is queued and processed in the background.
 * Delivers a signed, time-limited download link instead of a ZIP attachment.
 */
class MasterpiecesExportLinkMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string  $fromAddress,
        public ?string $fromName    = null,
        public string  $shopName    = '',
        public int     $imagesCount = 0,
        public string  $exportLabel = 'All in one folder',
        public string  $downloadUrl = '',
        public string  $zipFilename = 'masterpieces-export.zip',
        public string  $expiresAt   = '',
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from:    new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: 'Your masterpiece export is ready — ' . $this->shopName,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.shopify.masterpieces-export-link',
        );
    }

    public function attachments(): array
    {
        return []; // Link-delivery mode — no attachment.
    }
}
