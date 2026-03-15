<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\LiveChatConversation;
use App\Models\LiveChatMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportController extends Controller
{
    use GetsCurrentShop;

    public function index(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) abort(403, 'Shop not authenticated');

        $status = $request->input('status', 'all');

        $tickets = LiveChatConversation::where('merchant_id', $shop->id)
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->orderByDesc('updated_at')
            ->get()
            ->map(function ($t) {
                // Hide internal states from merchant
                $displayStatus = in_array($t->status, ['spam', 'blocked']) ? 'ended' : $t->status;
                
                return [
                    'id' => $t->id,
                    'subject' => $t->subject ?? 'Support Ticket #' . $t->id,
                    'status' => $displayStatus,
                    'preview' => $t->last_message_preview,
                    'created_at' => $t->created_at->toIso8601String(),
                    'updated_at' => $t->updated_at->toIso8601String(),
                    'unread_count' => $t->messages()
                        ->where('sender_type', \App\Models\LiveChatMessage::SENDER_AGENT)
                        ->where('is_read', false)
                        ->where('is_internal_note', false)
                        ->count(),
                    'messages' => $t->messages()
                        ->select('id', 'sender_type', 'sender_name', 'body', 'created_at', 'is_internal_note', 'message_type')
                        ->where('is_internal_note', false)
                        ->where('sender_type', '!=', \App\Models\LiveChatMessage::SENDER_SYSTEM)
                        ->where('message_type', '!=', \App\Models\LiveChatMessage::TYPE_SYSTEM)
                        ->orderBy('created_at')
                        ->get(),
                ];
            });

        return Inertia::render('Shopify/Pages/Support/Index', [
            'shopName' => $shop->name ?? 'Shop',
            'tickets' => $tickets,
            'filters' => [
                'status' => $status
            ],
            'syncSettings' => \App\Models\SiteSetting::getChatSyncSettings(),
        ]);
    }

    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info("TICKET STORE HIT: ", $request->all());
        $shop = $this->currentShop($request);
        if (! $shop) abort(403);

        $request->validate([
            'subject' => 'required|string|max:190',
            'message' => 'required|string',
        ]);

        $conversation = LiveChatConversation::create([
            'merchant_id' => $shop->id,
            'customer_name' => $shop->name ?? 'Merchant',
            'customer_email' => $shop->email ?? 'no-reply@merchant.com',
            'subject' => $request->input('subject'),
            'status' => 'waiting',
            'last_message_preview' => \Illuminate\Support\Str::limit($request->input('message'), 100),
            'last_message_at' => now(),
            'unread_count' => 1,
        ]);

        $message = $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_CUSTOMER, 'sender_id' => null,
            'body' => $request->input('message'),
            'is_read' => false,
        ]);

        broadcast(new \App\Events\NewChatMessage($message))->toOthers();

        return redirect()->route('shopify.support')->with('success', 'Ticket created successfully.');
    }

    public function reply(Request $request, $id)
    {
        $shop = $this->currentShop($request);
        if (! $shop) abort(403);

        $request->validate([
            'message' => 'required|string',
        ]);

        $conversation = LiveChatConversation::where('merchant_id', $shop->id)->findOrFail($id);

        $message = $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_CUSTOMER, 'sender_id' => null,
            'body' => $request->input('message'),
            'is_read' => false,
        ]);

        $conversation->update([
            'last_message_preview' => \Illuminate\Support\Str::limit($request->input('message'), 100),
            'last_message_at' => now(),
            'status' => 'waiting',
            'unread_count' => \Illuminate\Support\Facades\DB::raw('unread_count + 1'),
        ]);

        broadcast(new \App\Events\NewChatMessage($message))->toOthers();

        return redirect()->route('shopify.support')->with('success', 'Reply sent.');
    }

    public function poll(Request $request, $id)
    {
        $shop = $this->currentShop($request);
        if (! $shop) abort(403);

        $conversation = LiveChatConversation::where('merchant_id', $shop->id)->findOrFail($id);
        
        // When polling, we mark all unread messages as read from the customer's perspective
        $conversation->messages()
            ->where('sender_type', LiveChatMessage::SENDER_AGENT)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'messages' => $conversation->messages()
                ->select('id', 'sender_type', 'sender_name', 'body', 'created_at', 'is_internal_note', 'message_type')
                ->where('is_internal_note', false)
                ->where('sender_type', '!=', \App\Models\LiveChatMessage::SENDER_SYSTEM)
                ->where('message_type', '!=', \App\Models\LiveChatMessage::TYPE_SYSTEM)
                ->orderBy('created_at')
                ->get()
        ]);
    }
}
