<?php

namespace App\Mail\Admin;

use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UpscalerSettingsChangedMail extends Mailable
{
    use Queueable, SerializesModels;

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
        return new Envelope(
            subject: 'Upscaler Settings Changed',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.upscaler-settings-changed',
            with: [
                'admin' => $this->admin,
                'changes' => $this->changes,
                'isReset' => $this->isReset,
            ],
        );
    }
}
