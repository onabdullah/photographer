<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_studio_daily_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('date')->index();
            $table->string('tool_used', 64)->index();
            $table->unsignedInteger('total_completed')->default(0);
            $table->unsignedInteger('total_failed')->default(0);
            $table->unsignedInteger('used_in_production')->default(0);
            $table->timestamps();

            $table->unique(['date', 'tool_used']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_studio_daily_snapshots');
    }
};
