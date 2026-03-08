<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Valid roles and their human-readable labels.
     */
    const ROLES = [
        'super_admin' => 'Super Admin',
        'admin'       => 'Admin',
        'viewer'      => 'Viewer',
    ];

    /**
     * Permissions granted per role (legacy, when admin_role_id is null).
     * super_admin gets the wildcard ['*'] which bypasses all checks.
     */
    const ROLE_PERMISSIONS = [
        'super_admin' => ['*'],
        'admin' => [
            'dashboard.view',
            'merchants.view', 'merchants.manage',
            'products.view', 'products.manage',
            'ai.view', 'ai.manage',
            'analytics.view',
            'users.view', 'users.manage',
            'roles.view', 'roles.manage',
            'settings.view', 'settings.manage', 'settings.smtp',
            'developer.terminal',
        ],
        'viewer' => [
            'dashboard.view',
            'merchants.view',
            'products.view',
            'ai.view',
            'analytics.view',
            'users.view',
            'roles.view',
            'settings.view',
        ],
    ];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'admin_role_id',
        'status',
        'last_login_at',
    ];

    public function adminRole()
    {
        return $this->belongsTo(AdminRole::class, 'admin_role_id');
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
        ];
    }

    /**
     * Returns the permissions array for this user's role.
     * Prefers adminRole->permissions when admin_role_id is set; otherwise uses legacy ROLE_PERMISSIONS.
     */
    public function getPermissionsAttribute(): array
    {
        if ($this->admin_role_id) {
            $role = $this->adminRole;
            return $role?->permissions ?? [];
        }
        return self::ROLE_PERMISSIONS[$this->role ?? 'viewer'] ?? [];
    }

    /**
     * Check whether this user has a given permission.
     */
    public function can($permission, $arguments = []): bool
    {
        $perms = $this->permissions;
        if (in_array('*', $perms)) return true;
        return in_array($permission, $perms);
    }
}
