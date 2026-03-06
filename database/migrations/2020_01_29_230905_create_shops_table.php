<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Osiset\ShopifyApp\Util;

class CreateShopsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create(Util::getShopsTable(), function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            
            $table->boolean('shopify_grandfathered')->default(false);
            $table->string('shopify_namespace')->nullable();
            $table->boolean('shopify_freemium')->default(false);
            $table->unsignedInteger('plan_id')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            $table->rememberToken();

            $table->foreign('plan_id')->references('id')->on(Util::getShopifyConfig('table_names.plans', 'plans'));
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        Schema::dropIfExists(Util::getShopsTable());
    }
}
