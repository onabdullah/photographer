<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginLog extends Model
{
    const STATUS_SUCCESS = 'success';
    const STATUS_FAILED  = 'failed';

    const EVENT_LOGIN  = 'login';
    const EVENT_LOGOUT = 'logout';

    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'status',
        'event_type',
        'location',
        'country',
        'city',
        'browser',
        'os',
        'device_type',
        'risk_percentage',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Compute risk percentage for a login attempt: higher for failed attempts from same IP.
     */
    public static function computeRisk(string $ip, string $status): int
    {
        $risk = 0;
        if ($status === self::STATUS_FAILED) {
            $recentFailures = static::where('ip_address', $ip)
                ->where('status', self::STATUS_FAILED)
                ->where('created_at', '>=', now()->subHours(24))
                ->count();
            $risk = min(100, 30 + ($recentFailures * 15));
        }
        return min(100, $risk);
    }
}
