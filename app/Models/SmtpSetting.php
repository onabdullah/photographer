<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmtpSetting extends Model
{
    protected $fillable = [
        'name',
        'purpose',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_address',
        'from_name',
        'is_active',
    ];

    protected $casts = [
        'port' => 'integer',
        'is_active' => 'boolean',
        'password' => 'encrypted',
    ];

    public const PURPOSE_SUPPORT = 'support';
    public const PURPOSE_MARKETING = 'marketing';
    public const PURPOSE_GENERAL = 'general';

    public static function purposes(): array
    {
        return [
            self::PURPOSE_SUPPORT => 'Support (replies, tickets, notifications)',
            self::PURPOSE_MARKETING => 'Marketing (newsletters, campaigns)',
            self::PURPOSE_GENERAL => 'General (transactional, system emails)',
        ];
    }

    public static function encryptionOptions(): array
    {
        return [
            null => 'None',
            'tls' => 'TLS',
            'ssl' => 'SSL',
        ];
    }

    public function mailLogs(): HasMany
    {
        return $this->hasMany(MailLog::class, 'smtp_setting_id');
    }

    /** Get the active SMTP config for a given purpose, or null. */
    public static function activeForPurpose(string $purpose): ?self
    {
        return self::where('purpose', $purpose)->where('is_active', true)->first();
    }

    /** When setting this config active, deactivate others of the same purpose. */
    protected static function booted(): void
    {
        static::saving(function (self $model) {
            if ($model->is_active) {
                self::where('purpose', $model->purpose)
                    ->where('id', '!=', $model->id)
                    ->update(['is_active' => false]);
            }
        });
    }
}
