<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('image_generations', function (Blueprint $table) {
            $table->id();
            $table->string('shop_domain')->index();
            $table->string('tool_used')->default('background_remover');
            $table->string('api_job_id')->nullable()->index();
            $table->string('original_image_url');
            $table->string('result_image_url')->nullable();
            $table->unsignedBigInteger('shopify_product_id')->nullable()->index();
            $table->enum('status', ['processing', 'completed', 'failed'])->default('processing');
            $table->text('error_message')->nullable();
            $table->decimal('processing_time_seconds', 12, 4)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('image_generations');
    }
};
