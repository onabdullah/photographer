<?php

namespace Tests\Feature\Admin;

use App\Models\LiveChatConversation;
use App\Models\LiveChatMessage;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LiveChatTest extends TestCase
{
    use RefreshDatabase;

    // ─── helpers ────────────────────────────────────────────────────────────

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => 'super_admin']);
    }

    private function viewer(): User
    {
        return User::factory()->create(['role' => 'viewer']);
    }

    private function conversation(array $attrs = []): LiveChatConversation
    {
        return LiveChatConversation::factory()->create($attrs);
    }

    // ─── INDEX ───────────────────────────────────────────────────────────────

    public function test_index_renders_for_super_admin(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin, 'admin')
            ->get('/admin/live-chat')
            ->assertOk()
            ->assertInertia(fn ($page) =>
                $page->component('Admin/Pages/LiveChat/Index', false)
                     ->has('conversations')
                     ->has('kpis')
                     ->has('syncSettings')
            );
    }

    public function test_index_is_forbidden_for_unauthenticated(): void
    {
        // Unauthenticated admin guard redirects to the default login route
        $this->get('/admin/live-chat')->assertRedirect('/login');
    }

    public function test_index_returns_kpis(): void
    {
        $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);
        $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);
        $this->conversation(['status' => LiveChatConversation::STATUS_ENDED]);

        $response = $this->actingAs($this->superAdmin(), 'admin')
            ->get('/admin/live-chat')
            ->assertOk();

        $response->assertInertia(fn ($page) =>
            $page->where('kpis.total', 3)
                 ->where('kpis.active', 2)
                 ->where('kpis.ended', 1)
        );
    }

    public function test_index_filters_by_status(): void
    {
        $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);
        $this->conversation(['status' => LiveChatConversation::STATUS_ENDED]);

        $response = $this->actingAs($this->superAdmin(), 'admin')
            ->get('/admin/live-chat?status=active')
            ->assertOk();

        $response->assertInertia(fn ($page) =>
            $page->has('conversations.data', 1)
        );
    }

    // ─── MESSAGES ────────────────────────────────────────────────────────────

    public function test_messages_loads_for_valid_conversation(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);
        LiveChatMessage::factory()->count(3)->create(['conversation_id' => $conv->id]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->getJson("/admin/live-chat/conversations/{$conv->id}/messages")
            ->assertOk()
            ->assertJsonStructure(['conversation', 'messages', 'synced_at'])
            ->assertJsonCount(3, 'messages');
    }

    public function test_messages_returns_404_for_missing_conversation(): void
    {
        $this->actingAs($this->superAdmin(), 'admin')
            ->getJson('/admin/live-chat/conversations/999999/messages')
            ->assertNotFound();
    }

    // ─── POLL ────────────────────────────────────────────────────────────────

    public function test_poll_returns_only_newer_messages(): void
    {
        $conv = $this->conversation();
        $old = LiveChatMessage::factory()->create(['conversation_id' => $conv->id]);
        $new = LiveChatMessage::factory()->create(['conversation_id' => $conv->id]);

        $response = $this->actingAs($this->superAdmin(), 'admin')
            ->getJson("/admin/live-chat/conversations/{$conv->id}/poll?since_id={$old->id}")
            ->assertOk()
            ->assertJsonCount(1, 'messages');

        $this->assertEquals($new->id, $response->json('messages.0.id'));
    }

    // ─── SEND MESSAGE ────────────────────────────────────────────────────────

    public function test_send_message_creates_message(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/messages", [
                'body'             => 'Hello from agent!',
                'is_internal_note' => false,
            ])
            ->assertCreated()
            ->assertJsonPath('message.body', 'Hello from agent!')
            ->assertJsonPath('message.sender_type', 'agent');

        $this->assertDatabaseHas('live_chat_messages', [
            'conversation_id'  => $conv->id,
            'body'             => 'Hello from agent!',
            'sender_type'      => 'agent',
            'is_internal_note' => false,
        ]);
    }

    public function test_send_internal_note(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/messages", [
                'body'             => 'Private note.',
                'is_internal_note' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('message.is_internal_note', true);
    }

    public function test_send_message_requires_body(): void
    {
        $conv = $this->conversation();

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/messages", ['body' => ''])
            ->assertUnprocessable();
    }

    public function test_send_message_forbidden_for_viewer(): void
    {
        $conv = $this->conversation();

        $this->actingAs($this->viewer(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/messages", ['body' => 'Hi'])
            ->assertForbidden();
    }

    // ─── STATE TRANSITIONS ───────────────────────────────────────────────────

    public function test_end_conversation(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'end'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'ended');

        $this->assertDatabaseHas('live_chat_conversations', ['id' => $conv->id, 'status' => 'ended']);
    }

    public function test_mute_and_unmute_conversation(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'mute'])
            ->assertOk()
            ->assertJsonPath('conversation.is_muted', true);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'unmute'])
            ->assertOk()
            ->assertJsonPath('conversation.is_muted', false);
    }

    public function test_mark_spam(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'spam'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'spam');
    }

    public function test_block(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'block'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'blocked');
    }

    public function test_convert(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ACTIVE]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'convert'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'converted');
    }

    public function test_restore_ended_conversation(): void
    {
        $conv = $this->conversation(['status' => LiveChatConversation::STATUS_ENDED]);

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'restore'])
            ->assertOk()
            ->assertJsonPath('conversation.status', 'active');
    }

    public function test_invalid_action_returns_422(): void
    {
        $conv = $this->conversation();

        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'launch_rocket'])
            ->assertUnprocessable();
    }

    public function test_state_change_forbidden_for_viewer(): void
    {
        $conv = $this->conversation();

        $this->actingAs($this->viewer(), 'admin')
            ->postJson("/admin/live-chat/conversations/{$conv->id}/state", ['action' => 'end'])
            ->assertForbidden();
    }

    // ─── SYNC SETTINGS ───────────────────────────────────────────────────────

    public function test_sync_settings_saves_correctly(): void
    {
        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson('/admin/live-chat/sync-settings', [
                'realtime_enabled'                  => true,
                'auto_fallback_enabled'             => false,
                'auto_return_realtime'              => true,
                'manual_refresh_interval_seconds'   => 15,
                'fallback_threshold_seconds'        => 45,
                'recovery_threshold_seconds'        => 60,
                'show_status_badge_agents'          => true,
                'show_status_badge_customers'       => false,
            ])
            ->assertOk()
            ->assertJsonStructure(['syncSettings']);

        // SiteSetting stores booleans as '1'/'0'
        $this->assertEquals('1', SiteSetting::get(SiteSetting::KEY_CHAT_REALTIME_ENABLED));
        $this->assertEquals('15', SiteSetting::get(SiteSetting::KEY_CHAT_MANUAL_REFRESH_INTERVAL_SECONDS));
    }

    public function test_sync_settings_validates_interval_range(): void
    {
        $this->actingAs($this->superAdmin(), 'admin')
            ->postJson('/admin/live-chat/sync-settings', [
                'realtime_enabled'                  => false,
                'auto_fallback_enabled'             => false,
                'auto_return_realtime'              => false,
                'manual_refresh_interval_seconds'   => 0, // invalid – must be >= 3
                'fallback_threshold_seconds'        => 30,
                'recovery_threshold_seconds'        => 30,
                'show_status_badge_agents'          => false,
                'show_status_badge_customers'       => false,
            ])
            ->assertUnprocessable();
    }

    public function test_sync_settings_forbidden_for_viewer(): void
    {
        $this->actingAs($this->viewer(), 'admin')
            ->postJson('/admin/live-chat/sync-settings', [
                'realtime_enabled'                  => false,
                'auto_fallback_enabled'             => false,
                'auto_return_realtime'              => false,
                'manual_refresh_interval_seconds'   => 12,
                'fallback_threshold_seconds'        => 30,
                'recovery_threshold_seconds'        => 30,
                'show_status_badge_agents'          => false,
                'show_status_badge_customers'       => false,
            ])
            ->assertForbidden();
    }
}
