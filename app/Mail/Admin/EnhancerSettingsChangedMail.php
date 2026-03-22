<?php

namespace App\Mail\Admin;

use App\Models\AdminUser;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EnhancerSettingsChangedMail extends Mailable
{
    use SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public AdminUser $admin,
        public array $changes,
        public bool $isReset = false,
    ) {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->isReset
            ? 'Image Enhancer Settings Reset'
            : 'Image Enhancer Settings Updated';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.admin.enhancer-settings-changed',
            with: [
                'admin' => $this->admin,
                'changes' => $this->changes,
                'isReset' => $this->isReset,
            ],
        );
    }
}
