<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

class LiveChatMessage extends Model
{
    /** @use HasFactory<\Database\Factories\LiveChatMessageFactory> */
    use HasFactory;

    public const SENDER_AGENT = 'agent';
    public const SENDER_CUSTOMER = 'customer';
    public const SENDER_SYSTEM = 'system';

    public const TYPE_TEXT = 'text';
    public const TYPE_SYSTEM = 'system';
    public const TYPE_ATTACHMENT = 'attachment';

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_id',
        'sender_name',
        'message_type',
        'is_internal_note',
        'body',
        'attachments',
        'client_uid',
        'is_read',
        'read_at',
    ];

    protected $casts = [
        'is_internal_note' => 'boolean',
        'attachments' => 'array',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(LiveChatConversation::class, 'conversation_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
