<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminRole extends Model
{
    /**
     * All available permissions in the system, grouped by category.
     * Each key is the permission slug used in checks.
     */
    const ALL_PERMISSIONS = [
        'DASHBOARD' => [
            'dashboard.view'    => 'Dashboard View',
        ],
        'MERCHANTS' => [
            'merchants.view'    => 'Merchants View',
            'merchants.manage'  => 'Merchants Manage',
        ],
        'PRODUCTS' => [
            'products.view'     => 'Products View',
            'products.manage'   => 'Products Manage',
        ],
        'AI PROCESSING' => [
            'ai.view'           => 'AI View',
            'ai.manage'         => 'AI Manage',
        ],
        'ANALYTICS' => [
            'analytics.view'    => 'Analytics View',
        ],
        'USERS' => [
            'users.view'        => 'Users View',
            'users.manage'      => 'Users Manage',
        ],
        'ROLES' => [
            'roles.view'        => 'Roles View',
            'roles.manage'      => 'Roles Manage',
        ],
        'SYSTEM SETTINGS' => [
            'settings.view'     => 'Settings View',
            'settings.manage'   => 'Settings Manage',
        ],
        'DEVELOPER' => [
            'developer.terminal'=> 'Artisan Terminal',
        ],
    ];

    protected $fillable = ['name', 'permissions'];

    protected $casts = [
        'permissions' => 'array',
    ];

    public function users()
    {
        return $this->hasMany(User::class, 'admin_role_id');
    }

    /** Total number of permissions granted in this role. */
    public function getPermissionsCountAttribute(): int
    {
        return count($this->permissions ?? []);
    }

    /** Flat list of all available permission slugs across every group. */
    public static function allPermissionKeys(): array
    {
        return collect(self::ALL_PERMISSIONS)
            ->flatMap(fn ($group) => array_keys($group))
            ->values()
            ->all();
    }
}
