<?php

namespace Database\Seeders;

use App\Models\AdminRole;
use Illuminate\Database\Seeder;

/**
 * Seeds admin roles and their default permissions.
 *
 * Idempotent / safe to re-run:
 * - New role (name not in DB): create it with default permissions.
 * - Existing role: only ADD permissions that are in the default set but not yet
 *   in the role; skip already-assigned permissions. Never remove or overwrite
 *   existing permissions. This way we preserve customizations and only apply
 *   new permissions when the seeder is updated (e.g. new feature like ai_studio.view).
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
            'analytics.view', 'ai_studio.view',
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
            'analytics.view', 'ai_studio.view',
            'users.view', 'users.manage',
            'roles.view',
            'settings.view',
        ],
        'Viewer' => [
            'dashboard.view',
            'merchants.view',
            'products.view',
            'ai.view',
            'analytics.view', 'ai_studio.view',
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

            // Only add permissions from default set that are not already in the role (skip existing)
            $current = $role->permissions ?? [];
            $toAdd = array_diff($defaultPerms, $current);
            $toAdd = array_values(array_intersect($toAdd, $allKeys));

            if (empty($toAdd)) {
                continue;
            }

            $role->permissions = array_values(array_unique(array_merge($current, $toAdd)));
            $role->save();
            $this->command?->info("Updated role '{$name}': added " . count($toAdd) . ' permission(s)');
        }
    }
}
