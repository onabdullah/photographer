<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{conversationId}', function ($user, $conversationId) {
    if ($user instanceof \App\Models\User) {
        return true; // Admins can listen to all chats
    }
    
    // Check if the current shopify user owns this conversation
    if ($user instanceof \App\Models\Merchant) {
        $conv = \App\Models\LiveChatConversation::find($conversationId);
        return $conv && $conv->merchant_id === $user->id;
    }
    
    return false; // Fallback
});

Broadcast::channel('admin.chat', function ($user) {
    return $user instanceof \App\Models\User;
});
