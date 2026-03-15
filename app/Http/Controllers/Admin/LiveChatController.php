<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLiveChatMessageRequest;
use App\Http\Requests\UpdateLiveChatConversationStateRequest;
use App\Http\Requests\UpdateLiveChatSyncSettingsRequest;
use App\Models\LiveChatConversation;
use App\Models\LiveChatMessage;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveChatController extends Controller
{
    /**
     * Admin Live Chat Console: render the Inertia page with conversation list,
     * active thread, and sync settings.
     */
    public function index(Request $request): Response
    {
        $statusFilter = $request->input('status', 'active');
        $search = $request->input('search');

        $query = LiveChatConversation::query()
            ->with('assignee:id,name')
            ->when(
                $statusFilter !== 'all',
                fn ($q) => $q->where('status', $statusFilter),
            )
            ->when($search, fn ($q) => $q
                ->where('customer_name', 'like', "%{$search}%")
                ->orWhere('customer_email', 'like', "%{$search}%")
                ->orWhere('subject', 'like', "%{$search}%")
            )
            ->orderByDesc('last_message_at')
            ->paginate(30)
            ->withQueryString()
            ->through(fn (LiveChatConversation $c) => $this->serializeConversation($c));

        $kpis = $this->buildKpis();

        return Inertia::render('Admin/Pages/LiveChat/Index', [
            'conversations' => $query,
            'filters' => [
                'status' => $statusFilter,
                'search' => $search,
            ],
            'kpis' => $kpis,
            'syncSettings' => SiteSetting::getChatSyncSettings(),
        ]);
    }

    /**
     * Return messages for a single conversation (JSON, used by the chat thread panel).
     */
    public function messages(Request $request, int $id): JsonResponse
    {
        $conversation = LiveChatConversation::with('merchant.imageGenerations', 'merchant.plan')->findOrFail($id);

        $messages = $conversation->messages()
            ->orderBy('created_at')
            ->get()
            ->map(fn (LiveChatMessage $m) => $this->serializeMessage($m));

        // Mark all customer messages as read.
        $conversation->messages()
            ->where('sender_type', LiveChatMessage::SENDER_CUSTOMER)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        // Reset unread counter.
        $conversation->update(['unread_count' => 0]);

        return response()->json([
            'conversation' => $this->serializeConversation($conversation->fresh()),
            'messages' => $messages,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Poll for new messages since the given message id (manual refresh fallback).
     */
    public function poll(Request $request, int $id): JsonResponse
    {
        $conversation = LiveChatConversation::findOrFail($id);
        $since = (int) $request->input('since_id', 0);

        $messages = $conversation->messages()
            ->when($since > 0, fn ($q) => $q->where('id', '>', $since))
            ->orderBy('created_at')
            ->get()
            ->map(fn (LiveChatMessage $m) => $this->serializeMessage($m));

        return response()->json([
            'messages' => $messages,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Agent sends a reply or leaves an internal note.
     */
    public function sendMessage(StoreLiveChatMessageRequest $request, int $id): JsonResponse
    {
        $conversation = LiveChatConversation::findOrFail($id);
        $agent = $request->user('admin') ?? $request->user();

        $message = $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_AGENT,
            'sender_id' => $agent?->id,
            'sender_name' => $agent?->name ?? 'Support Agent',
            'message_type' => $request->input('message_type', LiveChatMessage::TYPE_TEXT),
            'is_internal_note' => (bool) $request->input('is_internal_note', false),
            'body' => $request->input('body') ?? '',
            'attachments' => $request->input('attachments'),
            'client_uid' => $request->input('client_uid'),
            'is_read' => true,
            'read_at' => now(),
        ]);

        // Update conversation preview.
        $preview = $message->is_internal_note
            ? '[Internal note] ' . $this->truncate($message->body, 100)
            : $this->truncate($message->body, 120);

        $conversation->update([
            'last_message_preview' => $preview,
            'last_message_at' => now(),
            'status' => $conversation->status === LiveChatConversation::STATUS_WAITING
                ? LiveChatConversation::STATUS_ACTIVE
                : $conversation->status,
        ]);

        return response()->json([
            'message' => $this->serializeMessage($message),
        ], 201);
    }

    /**
     * Transition conversation to a new state (end, spam, mute, block, etc.).
     * Destructive actions require the caller to have explicitly confirmed in the UI.
     */
    public function updateState(UpdateLiveChatConversationStateRequest $request, int $id): JsonResponse
    {
        $conversation = LiveChatConversation::findOrFail($id);
        $action = $request->input('action');
        $agent = $request->user('admin') ?? $request->user();
        $reason = $request->input('reason');

        $systemMessage = null;

        match ($action) {
            'end' => $this->performEnd($conversation, $agent, $reason, $systemMessage),
            'spam' => $this->performSpam($conversation, $agent, $systemMessage),
            'block' => $this->performBlock($conversation, $agent, $systemMessage),
            'mute' => $this->performMute($conversation, true, $agent, $systemMessage),
            'unmute' => $this->performMute($conversation, false, $agent, $systemMessage),
            'convert' => $this->performConvert($conversation, $agent, $systemMessage),
            'waiting' => $this->performSetStatus($conversation, LiveChatConversation::STATUS_WAITING, $agent, $systemMessage),
            'active' => $this->performSetStatus($conversation, LiveChatConversation::STATUS_ACTIVE, $agent, $systemMessage),
            'unspam', 'restore' => $this->performRestore($conversation, $agent, $systemMessage),
            default => null,
        };

        return response()->json([
            'conversation' => $this->serializeConversation($conversation->fresh()),
            'system_message' => $systemMessage ? $this->serializeMessage($systemMessage) : null,
        ]);
    }

    /**
     * Save live chat sync settings.
     */
    public function saveSyncSettings(UpdateLiveChatSyncSettingsRequest $request): JsonResponse
    {
        SiteSetting::setChatSyncSettings($request->validated());

        return response()->json([
            'message' => 'Sync settings saved.',
            'syncSettings' => SiteSetting::getChatSyncSettings(),
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Private: state transition helpers
    // ────────────────────────────────────────────────────────────────────────────

    private function performEnd(
        LiveChatConversation $conversation,
        mixed $agent,
        ?string $reason,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['status' => LiveChatConversation::STATUS_ENDED]);
        $systemMessage = $this->insertSystemMessage(
            $conversation,
            'Conversation ended by ' . ($agent?->name ?? 'agent') . ($reason ? ": {$reason}" : '.'),
        );
    }

    private function performSpam(
        LiveChatConversation $conversation,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['status' => LiveChatConversation::STATUS_SPAM, 'is_spam' => true]);
        $systemMessage = $this->insertSystemMessage($conversation, 'Marked as spam by ' . ($agent?->name ?? 'agent') . '.');
    }

    private function performBlock(
        LiveChatConversation $conversation,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['status' => LiveChatConversation::STATUS_BLOCKED, 'is_blocked' => true]);
        $systemMessage = $this->insertSystemMessage($conversation, 'Participant blocked by ' . ($agent?->name ?? 'agent') . '.');
    }

    private function performMute(
        LiveChatConversation $conversation,
        bool $mute,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['is_muted' => $mute]);
        $label = $mute ? 'Muted' : 'Unmuted';
        $systemMessage = $this->insertSystemMessage($conversation, "{$label} by " . ($agent?->name ?? 'agent') . '.');
    }

    private function performConvert(
        LiveChatConversation $conversation,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['status' => LiveChatConversation::STATUS_CONVERTED, 'is_converted' => true]);
        $systemMessage = $this->insertSystemMessage($conversation, 'Converted to follow-up workflow by ' . ($agent?->name ?? 'agent') . '.');
    }

    private function performSetStatus(
        LiveChatConversation $conversation,
        string $status,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update(['status' => $status]);
        $label = ucfirst($status);
        $systemMessage = $this->insertSystemMessage($conversation, "Marked as {$label} by " . ($agent?->name ?? 'agent') . '.');
    }

    private function performRestore(
        LiveChatConversation $conversation,
        mixed $agent,
        ?LiveChatMessage &$systemMessage,
    ): void {
        $conversation->update([
            'status' => LiveChatConversation::STATUS_ACTIVE,
            'is_spam' => false,
            'is_blocked' => false,
        ]);
        $systemMessage = $this->insertSystemMessage($conversation, 'Restored to active by ' . ($agent?->name ?? 'agent') . '.');
    }

    private function insertSystemMessage(LiveChatConversation $conversation, string $body): LiveChatMessage
    {
        return $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_SYSTEM,
            'sender_name' => 'System',
            'message_type' => LiveChatMessage::TYPE_SYSTEM,
            'body' => $body,
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    // ────────────────────────────────────────────────────────────────────────────
    // Private: serializers
    // ────────────────────────────────────────────────────────────────────────────

    /** @return array<string, mixed> */
    private function serializeConversation(LiveChatConversation $c): array
    {
        return [
            'id' => $c->id,
            'customer_name' => $c->customer_name ?? 'Anonymous',
            'customer_email' => $c->customer_email,
            'customer_avatar' => $c->customer_avatar,
            'subject' => $c->subject ?? '(No subject)',
            'status' => $c->status,
            'is_muted' => $c->is_muted,
            'is_spam' => $c->is_spam,
            'is_blocked' => $c->is_blocked,
            'is_converted' => $c->is_converted,
            'unread_count' => $c->unread_count,
            'last_message_preview' => $c->last_message_preview,
            'last_message_at' => $c->last_message_at?->toIso8601String(),
            'assignee' => $c->assignee ? ['id' => $c->assignee->id, 'name' => $c->assignee->name] : null,
            'sync_mode' => $c->sync_mode,
            'sync_status' => $c->sync_status,
            'last_synced_at' => $c->last_synced_at?->toIso8601String(),
            'created_at' => $c->created_at?->toIso8601String(),
            'merchant' => $c->relationLoaded('merchant') && $c->merchant ? [
                'id' => $c->merchant->id,
                'name' => $c->merchant->name,
                'email' => $c->merchant->email,
                'freemium' => $c->merchant->shopify_freemium,
                'country' => $c->merchant->country,
                'credits_balance' => $c->merchant->ai_credits_balance,
                'plan_name' => $c->merchant->relationLoaded('plan') && $c->merchant->plan ? $c->merchant->plan->name : 'Free Trial',
                'plan_price' => $c->merchant->relationLoaded('plan') && $c->merchant->plan ? $c->merchant->plan->price : null,
                'plan_remaining_days' => (function () use ($c) {
                    $charge = \Illuminate\Support\Facades\DB::table('charges')
                        ->where('user_id', $c->merchant->id)
                        ->where('status', 'ACTIVE')
                        ->orderByDesc('created_at')
                        ->first();
                    if ($charge && isset($charge->created_at)) {
                        $daysPassed = now()->diffInDays(\Carbon\Carbon::parse($charge->created_at));
                        return max(0, 30 - ($daysPassed % 30));
                    }
                    return 0;
                })(),
                'recent_creations' => $c->merchant->relationLoaded('imageGenerations')
                    ? $c->merchant->imageGenerations->sortByDesc('created_at')->take(4)->map(fn ($g) => [
                        'id' => $g->id,
                        'tool' => $g->tool_used,
                        'url' => $g->result_image_url,
                        'created_at' => $g->created_at->toIso8601String(),
                    ])->values()
                    : []
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function serializeMessage(LiveChatMessage $m): array
    {
        return [
            'id' => $m->id,
            'conversation_id' => $m->conversation_id,
            'sender_type' => $m->sender_type,
            'sender_id' => $m->sender_id,
            'sender_name' => $m->sender_name ?? ($m->sender_type === LiveChatMessage::SENDER_AGENT ? 'Agent' : 'Customer'),
            'message_type' => $m->message_type,
            'is_internal_note' => $m->is_internal_note,
            'body' => $m->body,
            'attachments' => $m->attachments ?? [],
            'client_uid' => $m->client_uid,
            'is_read' => $m->is_read,
            'read_at' => $m->read_at?->toIso8601String(),
            'created_at' => $m->created_at?->toIso8601String(),
        ];
    }

    private function buildKpis(): array
    {
        $total = LiveChatConversation::count();
        $active = LiveChatConversation::where('status', LiveChatConversation::STATUS_ACTIVE)->count();
        $waiting = LiveChatConversation::where('status', LiveChatConversation::STATUS_WAITING)->count();
        $ended = LiveChatConversation::where('status', LiveChatConversation::STATUS_ENDED)->count();
        $converted = LiveChatConversation::where('status', LiveChatConversation::STATUS_CONVERTED)->count();
        $totalUnread = (int) LiveChatConversation::sum('unread_count');

        return [
            'total' => $total,
            'active' => $active,
            'waiting' => $waiting,
            'ended' => $ended,
            'converted' => $converted,
            'unread' => $totalUnread,
        ];
    }

    private function truncate(string $text, int $max): string
    {
        if (strlen($text) <= $max) {
            return $text;
        }

        return substr($text, 0, $max - 3) . '...';
    }
}

