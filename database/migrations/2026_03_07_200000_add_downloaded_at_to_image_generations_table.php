<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('image_generations', function (Blueprint $table) {
            $table->timestamp('downloaded_at')->nullable()->after('processing_time_seconds')->index();
        });
    }

    public function down(): void
    {
        Schema::table('image_generations', function (Blueprint $table) {
            $table->dropColumn('downloaded_at');
        });
    }
};
