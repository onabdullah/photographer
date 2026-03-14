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
                return [
                    'id' => $t->id,
                    'subject' => $t->subject ?? 'Support Ticket #' . $t->id,
                    'status' => $t->status,
                    'preview' => $t->last_message_preview,
                    'created_at' => $t->created_at->toIso8601String(),
                    'updated_at' => $t->updated_at->toIso8601String(),
                    'messages' => $t->messages()->select('id', 'sender_type', 'body', 'created_at', 'is_internal_note')->orderBy('created_at')->get(),
                ];
            });

        return Inertia::render('Shopify/Pages/Support/Index', [
            'shopName' => $shop->name ?? 'Shop',
            'tickets' => $tickets,
            'filters' => [
                'status' => $status
            ]
        ]);
    }

    public function store(Request $request)
    {
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
            'last_message_preview' => substr($request->input('message'), 0, 100),
            'last_message_at' => now(),
            'unread_count' => 1,
        ]);

        $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_CUSTOMER,
            'body' => $request->input('message'),
            'is_read' => false,
        ]);

        return redirect()->back();
    }

    public function reply(Request $request, $id)
    {
        $shop = $this->currentShop($request);
        if (! $shop) abort(403);

        $request->validate([
            'message' => 'required|string',
        ]);

        $conversation = LiveChatConversation::where('merchant_id', $shop->id)->findOrFail($id);

        $conversation->messages()->create([
            'sender_type' => LiveChatMessage::SENDER_CUSTOMER,
            'body' => $request->input('message'),
            'is_read' => false,
        ]);

        $conversation->update([
            'last_message_preview' => substr($request->input('message'), 0, 100),
            'last_message_at' => now(),
            'status' => 'waiting',
            'unread_count' => $conversation->unread_count + 1,
        ]);

        return redirect()->back();
    }
}
