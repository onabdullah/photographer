<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('live_chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained('live_chat_conversations')->cascadeOnDelete();
            $table->string('sender_type', 24)->index();
            $table->foreignId('sender_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_name', 120)->nullable();
            $table->string('message_type', 24)->default('text');
            $table->boolean('is_internal_note')->default(false)->index();
            $table->text('body')->nullable();
            $table->json('attachments')->nullable();
            $table->string('client_uid', 64)->nullable()->index();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_chat_messages');
    }
};
