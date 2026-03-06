<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Osiset\ShopifyApp\Contracts\ShopModel as IShopModel;
use Osiset\ShopifyApp\Traits\ShopModel;

class Merchant extends Authenticatable implements IShopModel
{
    /** @use HasFactory<\Database\Factories\MerchantFactory> */
    use HasFactory, Notifiable, SoftDeletes, ShopModel;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'merchants';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'shopify_grand_child_scope',
        'shopify_namespace',
        'shopify_freemium',
        'plan_id',
        'deleted_at',
        'password',
        // Also allow updating tokens via package
        'shopify_token',
        'store_name',
        'shop_owner',
        'country',
        'ai_credits_balance',
        'app_settings',
    ];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            // 'password' => 'hashed', // Removed to stop hashing Shopify access tokens
            'shopify_freemium' => 'boolean',
            'ai_credits_balance' => 'integer',
            'app_settings' => 'array',
        ];
    }

    /**
     * Get the images for the merchant.
     */
    public function images()
    {
        return $this->hasMany(Image::class);
    }

    /**
     * Get the email logs for the merchant.
     */
    public function emailLogs()
    {
        return $this->hasMany(EmailLog::class);
    }
}
