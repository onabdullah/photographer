<?php

namespace Database\Factories;

use App\Models\LiveChatConversation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LiveChatConversation>
 */
class LiveChatConversationFactory extends Factory
{
    protected $model = LiveChatConversation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(LiveChatConversation::allStatuses());

        return [
            'customer_name' => fake()->name(),
            'customer_email' => fake()->safeEmail(),
            'subject' => fake()->sentence(4),
            'status' => $status,
            'is_muted' => $status === LiveChatConversation::STATUS_MUTED,
            'is_spam' => $status === LiveChatConversation::STATUS_SPAM,
            'is_blocked' => $status === LiveChatConversation::STATUS_BLOCKED,
            'is_converted' => $status === LiveChatConversation::STATUS_CONVERTED,
            'unread_count' => fake()->numberBetween(0, 6),
            'last_message_preview' => fake()->sentence(),
            'last_message_at' => fake()->dateTimeBetween('-3 days', 'now'),
            'sync_mode' => LiveChatConversation::SYNC_STATUS_LIVE,
            'sync_status' => LiveChatConversation::SYNC_STATUS_LIVE,
            'last_synced_at' => now(),
            'metadata' => [
                'source' => 'widget',
                'customer_timezone' => 'UTC',
            ],
        ];
    }
}
