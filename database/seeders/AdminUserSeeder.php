<?php

namespace Database\Seeders;

use App\Models\AdminRole;
use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure Super Admin role always has wildcard permissions.
        $superAdminRole = AdminRole::firstOrCreate(
            ['name' => 'Super Admin'],
            ['permissions' => ['*']]
        );

        $permissions = $superAdminRole->permissions ?? [];
        if (! in_array('*', $permissions, true)) {
            $permissions[] = '*';
            $superAdminRole->permissions = array_values(array_unique($permissions));
            $superAdminRole->save();
        }

        // Create or update the default seeded admin user.
        $user = User::firstOrCreate(
            ['email' => 'mabdullah.navicosoft@gmail.com'],
            [
                'name' => 'Abdullah Rasheed',
                'password' => 'password123', // Will be hashed by model cast
                'email_verified_at' => now(),
                'status' => 'active',
            ]
        );

        $user->forceFill([
            'role' => 'super_admin',
            'admin_role_id' => $superAdminRole->id,
            'status' => $user->status ?: 'active',
        ])->save();

        // Keep all super-admin operators bound to the Super Admin role so newly
        // seeded permissions/wildcard behavior are inherited consistently.
        User::query()
            ->where('role', 'super_admin')
            ->where(function ($q) use ($superAdminRole) {
                $q->whereNull('admin_role_id')
                    ->orWhere('admin_role_id', '!=', $superAdminRole->id);
            })
            ->update(['admin_role_id' => $superAdminRole->id]);
    }
}
