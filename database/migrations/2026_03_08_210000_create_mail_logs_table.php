<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('smtp_setting_id')->constrained('smtp_settings')->cascadeOnDelete();
            $table->string('to_address', 255);
            $table->string('subject', 255)->nullable();
            $table->string('status', 16)->comment('sent, failed');
            $table->unsignedInteger('duration_ms')->nullable()->comment('Time to send in milliseconds');
            $table->text('error_message')->nullable();
            $table->timestamp('sent_at');
            $table->timestamps();
        });

        Schema::table('mail_logs', function (Blueprint $table) {
            $table->index(['smtp_setting_id', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_logs');
    }
};
