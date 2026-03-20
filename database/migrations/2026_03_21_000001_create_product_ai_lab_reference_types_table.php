<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_ai_lab_reference_types', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 255)->unique();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->text('prompt_template');
            $table->integer('max_images_allowed')->default(5)->comment('1-14 images max per reference type');
            $table->integer('order_position')->default(0)->comment('Sort order in admin UI');
            $table->boolean('is_enabled')->default(true);
            $table->string('created_by', 255)->nullable()->comment('Admin email');
            $table->string('updated_by', 255)->nullable()->comment('Admin email');
            $table->timestamps();

            $table->index('slug');
            $table->index('is_enabled');
            $table->index('order_position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_ai_lab_reference_types');
    }
};
