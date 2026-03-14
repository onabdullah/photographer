<?php

namespace Database\Factories;

use App\Models\LiveChatConversation;
use App\Models\LiveChatMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LiveChatMessage>
 */
class LiveChatMessageFactory extends Factory
{
    protected $model = LiveChatMessage::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $senderType = fake()->randomElement([
            LiveChatMessage::SENDER_AGENT,
            LiveChatMessage::SENDER_CUSTOMER,
            LiveChatMessage::SENDER_SYSTEM,
        ]);

        $messageType = $senderType === LiveChatMessage::SENDER_SYSTEM
            ? LiveChatMessage::TYPE_SYSTEM
            : LiveChatMessage::TYPE_TEXT;

        return [
            'conversation_id' => LiveChatConversation::factory(),
            'sender_type' => $senderType,
            'sender_name' => $senderType === LiveChatMessage::SENDER_AGENT ? 'Support Agent' : fake()->firstName(),
            'message_type' => $messageType,
            'is_internal_note' => false,
            'body' => fake()->sentence(10),
            'attachments' => null,
            'client_uid' => fake()->uuid(),
            'is_read' => $senderType !== LiveChatMessage::SENDER_CUSTOMER,
            'read_at' => null,
        ];
    }
}
