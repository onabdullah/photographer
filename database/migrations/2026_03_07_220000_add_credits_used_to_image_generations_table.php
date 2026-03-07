<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('image_generations', function (Blueprint $table) {
            $table->unsignedTinyInteger('credits_used')->default(1)->after('downloaded_at');
        });
    }

    public function down(): void
    {
        Schema::table('image_generations', function (Blueprint $table) {
            $table->dropColumn('credits_used');
        });
    }
};
