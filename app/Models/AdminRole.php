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
            'merchants.view'       => 'Merchants View',
            'merchants.manage'     => 'Merchants Manage',
            'merchants.edit_credits'=> 'Merchants Edit Credits',
        ],
        'PRODUCTS' => [
            'products.view'     => 'Products View',
            'products.manage'   => 'Products Manage',
        ],
        'AI PROCESSING' => [
            'ai.view'           => 'AI View',
            'ai.manage'         => 'AI Manage',
        ],
        'ANALYTICS & REPORTS' => [
            'analytics.view'    => 'Analytics View',
            'ai_studio.view'    => 'AI Studio Tools View',
        ],
        'FINANCE' => [
            'finance.view'      => 'Finance View',
        ],
        'PLANS' => [
            'plans.view'        => 'Plans View',
            'plans.manage'      => 'Plans Manage',
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
            'settings.smtp'     => 'Settings SMTP (configure mail)',
        ],
        'DEVELOPER' => [
            'developer.terminal'=> 'Artisan Terminal',
        ],
        'LIVE CHAT' => [
            'live_chat.view'   => 'Live Chat View',
            'live_chat.manage' => 'Live Chat Manage',
        ],
        'AI TOOLS' => [
            'ai.tools.manage'  => 'AI Tools Manage (Nano Banana, model versions, guardrails)',
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
