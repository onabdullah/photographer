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
        // Add columns to merchants table
        Schema::table('merchants', function (Blueprint $table) {
            $table->integer('ai_credits_balance')->default(0)->after('password'); 
            // is_installed is handled by deleted_at (soft deletes) or existing package mechanics
        });

        // Add columns to plans table
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('monthly_credits')->default(0)->after('price');
        });

        // Create images table
        Schema::create('images', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('merchant_id')->nullable(); 
            // shop_id (nullable) as requested. Using merchant_id to align with model
            $table->string('original_image_url')->nullable();
            $table->string('generated_image_url')->nullable();
            $table->text('prompt_used')->nullable();
            $table->string('status')->default('processing'); // processing, completed, failed
            $table->timestamps();

            $table->foreign('merchant_id')->references('id')->on('merchants')->nullOnDelete();
        });

        // Create email_logs table
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('merchant_id')->nullable();
            $table->string('sent_to_email')->nullable();
            $table->string('email_type'); // welcome, out_of_credits
            $table->timestamps();

            $table->foreign('merchant_id')->references('id')->on('merchants')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
        Schema::dropIfExists('images');
        
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('monthly_credits');
        });

        Schema::table('merchants', function (Blueprint $table) {
            $table->dropColumn('ai_credits_balance');
        });
    }
};
