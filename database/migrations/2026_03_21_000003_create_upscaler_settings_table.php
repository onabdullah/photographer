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
        // Upscaler settings are stored in SiteSetting table with these keys:
        // - upscaler_model_version
        // - upscaler_default_scale (1-10)
        // - upscaler_default_face_enhance (boolean)
        // No need for dedicated table; use SiteSetting key-value pattern
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No table to drop
    }
};
