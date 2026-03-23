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
        Schema::create('product_ai_lab_aspect_ratios', function (Blueprint $table) {
            $table->id();
            $table->string('value')->unique();      // 1:1, 4:3, 16:9, etc.
            $table->string('label');                // Display label
            $table->integer('order_position')->default(0);
            $table->boolean('is_enabled')->default(true);
            $table->boolean('is_default')->default(false);
            $table->timestamps();

            $table->index('is_enabled');
            $table->index('order_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_ai_lab_aspect_ratios');
    }
};
