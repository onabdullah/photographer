<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('admin_role_id')
                  ->nullable()
                  ->after('role')
                  ->constrained('admin_roles')
                  ->nullOnDelete();

            $table->string('status')->default('active')->after('admin_role_id');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('admin_role_id');
            $table->dropColumn(['status', 'last_login_at']);
        });
    }
};
