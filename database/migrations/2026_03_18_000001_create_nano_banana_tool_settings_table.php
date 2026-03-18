<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nano_banana_tool_settings', function (Blueprint $table) {
            $table->id();
            $table->string('setting_key')->unique()->comment('Setting identifier: model_version, default_resolution, etc.');
            $table->text('setting_value')->nullable()->comment('JSON-serialized value or plain string');
            $table->string('data_type')->default('string')->comment('string|json|boolean|integer|float');
            $table->text('description')->nullable()->comment('Admin-visible description');
            $table->boolean('is_active')->default(true)->comment('Whether this setting is currently active');
            $table->timestamps();

            $table->index('is_active');
            $table->index('setting_key');
        });

        // Seed default settings from config
        \Illuminate\Support\Facades\DB::table('nano_banana_tool_settings')->insertOrIgnore([
            [
                'setting_key' => 'model_version',
                'setting_value' => config('ai_studio_tools.nano_banana.model_version'),
                'data_type' => 'string',
                'description' => 'Replicate model version hash for Nano Banana 2',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'default_resolution',
                'setting_value' => '1K',
                'data_type' => 'string',
                'description' => 'Default image resolution (1K|2K|4K)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'default_aspect_ratio',
                'setting_value' => 'match_input_image',
                'data_type' => 'string',
                'description' => 'Default aspect ratio for generated images',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'default_output_format',
                'setting_value' => 'jpg',
                'data_type' => 'string',
                'description' => 'Default output format (jpg|png)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'google_search_enabled',
                'setting_value' => '0',
                'data_type' => 'boolean',
                'description' => 'Enable Google Search grounding in prompts',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'image_search_enabled',
                'setting_value' => '0',
                'data_type' => 'boolean',
                'description' => 'Enable Image Search grounding in prompts',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'seed_reproducibility_enabled',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'description' => 'Allow merchants to use seed parameter for reproducibility',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'guidance_scale',
                'setting_value' => '7.5',
                'data_type' => 'float',
                'description' => 'Model guidance scale for prompt adherence (1-25)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'num_inference_steps',
                'setting_value' => '28',
                'data_type' => 'integer',
                'description' => 'Number of inference steps (10-100, higher = better quality)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'setting_key' => 'current_preset',
                'setting_value' => 'balanced',
                'data_type' => 'string',
                'description' => 'Currently active preset (balanced|quality|fast)',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nano_banana_tool_settings');
    }
};
