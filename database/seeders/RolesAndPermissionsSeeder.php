<?php

namespace Database\Seeders;

use App\Models\AdminRole;
use Illuminate\Database\Seeder;

/**
 * Seeds admin roles and their default permissions.
 *
 * Idempotent: creates roles that don't exist; for existing default roles,
 * merges in any new permissions from AdminRole::ALL_PERMISSIONS that are
 * in the default set but not yet assigned. Existing customizations are preserved.
 */
class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Default roles and their permission sets.
     * Keys must match AdminRole::ALL_PERMISSIONS slugs.
     */
    private const DEFAULT_ROLES = [
        'Super Admin' => ['*'],
        'Admin' => [
            'dashboard.view',
            'merchants.view', 'merchants.manage',
            'products.view', 'products.manage',
            'ai.view', 'ai.manage',
            'analytics.view',
            'users.view', 'users.manage',
            'roles.view', 'roles.manage',
            'settings.view', 'settings.manage',
            'developer.terminal',
        ],
        'Manager' => [
            'dashboard.view',
            'merchants.view', 'merchants.manage',
            'products.view', 'products.manage',
            'ai.view', 'ai.manage',
            'analytics.view',
            'users.view', 'users.manage',
            'roles.view',
            'settings.view',
        ],
        'Viewer' => [
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

    public function run(): void
    {
        $allKeys = AdminRole::allPermissionKeys();

        foreach (self::DEFAULT_ROLES as $name => $defaultPerms) {
            $role = AdminRole::firstOrCreate(
                ['name' => $name],
                ['permissions' => $defaultPerms]
            );

            if ($role->wasRecentlyCreated) {
                $this->command?->info("Created role: {$name}");
                continue;
            }

            // Merge: add any default permission not yet in the role
            $current = $role->permissions ?? [];
            $toAdd = array_diff($defaultPerms, $current);

            // Filter to only valid keys (in case we removed a permission from code)
            $toAdd = array_values(array_intersect($toAdd, $allKeys));

            if (! empty($toAdd)) {
                $role->permissions = array_values(array_unique(array_merge($current, $toAdd)));
                $role->save();
                $this->command?->info("Updated role '{$name}': added " . count($toAdd) . ' permission(s)');
            }
        }
    }
}
