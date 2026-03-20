<?php

namespace App\Mail\Admin;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProductAILabSettingsChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $changedAt;
    public string $changeType;

    public function __construct(
        public User $admin,
        public array $changes,
        public bool $isReset = false,
        public bool $isReferenceTypeChange = false,
        public string $fromAddress = '',
        public ?string $fromName = null,
        string $changedAt = '',
    ) {
        $this->fromAddress = $fromAddress ?: config('mail.from.address');
        $this->fromName = $fromName ?? config('mail.from.name') ?? config('app.name');
        $this->changedAt = $changedAt ?: now()->format('D, d M Y · H:i T');
        $this->changeType = $this->isReferenceTypeChange
            ? 'Reference Type ' . ($isReset ? 'Reset' : 'Changed')
            : ($isReset ? 'Settings Reset' : 'Settings Changed');
    }

    public function formatLabel(string $key): string
    {
        $labels = [
            'model_version' => 'Model Version',
            'prepend_prompt' => 'Prepend Prompt',
            'default_resolution' => 'Default Resolution',
            'default_aspect_ratio' => 'Default Aspect Ratio',
            'default_output_format' => 'Default Output Format',
            'features_enabled' => 'Features Enabled',
        ];

        return $labels[$key] ?? ucwords(str_replace('_', ' ', $key));
    }

    public function formatValue($value): string
    {
        if ($value === null || $value === '') {
            return 'N/A';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if (is_array($value)) {
            return json_encode($value, JSON_PRETTY_PRINT);
        }

        return (string) $value;
    }

    public function envelope(): Envelope
    {
        $subject = $this->isReset
            ? 'Product AI Lab Settings Reset — ' . config('app.name')
            : 'Product AI Lab Settings Changed — ' . config('app.name');

        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName),
            subject: $subject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.product-ai-lab-settings-changed',
        );
    }
}
