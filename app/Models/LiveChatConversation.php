<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Model;

class LiveChatConversation extends Model
{
    /** @use HasFactory<\Database\Factories\LiveChatConversationFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';
    public const STATUS_WAITING = 'waiting';
    public const STATUS_ENDED = 'ended';
    public const STATUS_CONVERTED = 'converted';
    public const STATUS_SPAM = 'spam';
    public const STATUS_BLOCKED = 'blocked';
    public const STATUS_MUTED = 'muted';

    public const SYNC_STATUS_LIVE = 'live';
    public const SYNC_STATUS_MANUAL = 'manual';

    protected $fillable = [
        'merchant_id',
        'customer_name',
        'customer_email',
        'customer_avatar',
        'subject',
        'status',
        'is_muted',
        'is_spam',
        'is_blocked',
        'is_converted',
        'unread_count',
        'last_message_preview',
        'last_message_at',
        'assignee_id',
        'sync_mode',
        'sync_status',
        'last_synced_at',
        'metadata',
    ];

    protected $casts = [
        'is_muted' => 'boolean',
        'is_spam' => 'boolean',
        'is_blocked' => 'boolean',
        'is_converted' => 'boolean',
        'last_message_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LiveChatMessage::class, 'conversation_id');
    }

    public static function allStatuses(): array
    {
        return [
            self::STATUS_ACTIVE,
            self::STATUS_WAITING,
            self::STATUS_ENDED,
            self::STATUS_CONVERTED,
            self::STATUS_SPAM,
            self::STATUS_BLOCKED,
            self::STATUS_MUTED,
        ];
    }
}
