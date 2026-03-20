<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_ai_lab_settings', function (Blueprint $table) {
            $table->id();
            $table->string('model_version', 255)->nullable();
            $table->string('changed_by', 255)->nullable(); // Admin email who made the change
            $table->timestamp('changed_at')->nullable();
            $table->timestamps();

            $table->index('changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_ai_lab_settings');
    }
};
