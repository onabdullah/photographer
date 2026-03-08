<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MailLog extends Model
{
    public const STATUS_SENT = 'sent';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'smtp_setting_id',
        'to_address',
        'subject',
        'status',
        'duration_ms',
        'error_message',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'duration_ms' => 'integer',
    ];

    public function smtpSetting(): BelongsTo
    {
        return $this->belongsTo(SmtpSetting::class, 'smtp_setting_id');
    }
}
