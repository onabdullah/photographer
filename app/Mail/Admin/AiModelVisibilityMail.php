<?php

namespace App\Mail\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AiModelVisibilityMail extends Mailable
{
    use Queueable, SerializesModels;

    public const TOOL_LABELS = [
        'universal_generate'  => 'Product AI Lab (VTO)',
        'background_remover'  => 'Background Remover',
        'magic_eraser'        => 'Magic Eraser',
        'compressor'          => 'Image Compressor',
        'upscaler'            => 'Image Upscaler',
        'enhance'             => 'AI Enhance',
        'lighting'            => 'Lighting Fix',
    ];

    public string $toolLabel;
    public string $changedAt;

    public function __construct(
        public User $user,
        public string $fromAddress,
        public ?string $fromName = null,
        public string $toolKey = '',
        public bool $visible = true,
        public string $ip = 'Unknown',
        public string $userAgent = 'Unknown',
        string $changedAt = '',
    ) {
        $this->toolLabel = self::TOOL_LABELS[$toolKey] ?? $toolKey;
        $this->changedAt = $changedAt ?: now()->format('D, d M Y · H:i T');
    }

    public function envelope(): Envelope
    {
        $action = $this->visible ? 'Shown on Store' : 'Hidden from Store';

        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?? config('app.name')),
            subject: $this->toolLabel . ' ' . $action . ' — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.ai-model-visibility',
        );
    }
}
