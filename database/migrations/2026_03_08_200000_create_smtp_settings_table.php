<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('smtp_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name', 128)->nullable()->comment('Optional label e.g. "Support Mailgun"');
            $table->string('purpose', 32)->comment('support, marketing, general');
            $table->string('host', 255);
            $table->unsignedSmallInteger('port')->default(587);
            $table->string('encryption', 16)->nullable()->comment('tls, ssl, or null');
            $table->string('username', 255)->nullable();
            $table->text('password')->nullable()->comment('Encrypted');
            $table->string('from_address', 255);
            $table->string('from_name', 128)->nullable();
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('smtp_settings');
    }
};
