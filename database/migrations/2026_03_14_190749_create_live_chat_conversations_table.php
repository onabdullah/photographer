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
        Schema::create('live_chat_conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->nullOnDelete();
            $table->string('customer_name', 120)->nullable();
            $table->string('customer_email', 190)->nullable();
            $table->string('customer_avatar', 255)->nullable();
            $table->string('subject', 190)->nullable();
            $table->string('status', 24)->default('active')->index();
            $table->boolean('is_muted')->default(false);
            $table->boolean('is_spam')->default(false);
            $table->boolean('is_blocked')->default(false);
            $table->boolean('is_converted')->default(false);
            $table->unsignedInteger('unread_count')->default(0);
            $table->string('last_message_preview', 255)->nullable();
            $table->timestamp('last_message_at')->nullable()->index();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sync_mode', 24)->default('live');
            $table->string('sync_status', 32)->default('live');
            $table->timestamp('last_synced_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_message_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_chat_conversations');
    }
};
