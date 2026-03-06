<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminRole;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $roles = AdminRole::withCount('users')
            ->latest()
            ->get()
            ->map(fn ($r) => [
                'id'               => $r->id,
                'name'             => $r->name,
                'permissions_count'=> $r->permissions_count,
                'users_count'      => $r->users_count,
                'created_at'       => $r->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Pages/Roles/Index', [
            'roles'           => $roles,
            'totalPermissions'=> count(AdminRole::allPermissionKeys()),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Pages/Roles/Create', [
            'allPermissions' => AdminRole::ALL_PERMISSIONS,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'string|in:' . implode(',', AdminRole::allPermissionKeys()),
        ]);

        AdminRole::create([
            'name'        => $data['name'],
            'permissions' => $data['permissions'] ?? [],
        ]);

        return redirect('/admin/roles')->with('success', 'Role created successfully.');
    }

    public function show(AdminRole $adminRole)
    {
        return Inertia::render('Admin/Pages/Roles/Show', [
            'role' => [
                'id'               => $adminRole->id,
                'name'             => $adminRole->name,
                'permissions'      => $adminRole->permissions ?? [],
                'permissions_count'=> $adminRole->permissions_count,
                'users_count'      => $adminRole->users()->count(),
                'created_at'       => $adminRole->created_at?->format('M j, Y'),
            ],
            'allPermissions' => AdminRole::ALL_PERMISSIONS,
        ]);
    }

    public function edit(AdminRole $adminRole)
    {
        return Inertia::render('Admin/Pages/Roles/Edit', [
            'role' => [
                'id'          => $adminRole->id,
                'name'        => $adminRole->name,
                'permissions' => $adminRole->permissions ?? [],
            ],
            'allPermissions' => AdminRole::ALL_PERMISSIONS,
        ]);
    }

    public function update(Request $request, AdminRole $adminRole)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'string|in:' . implode(',', AdminRole::allPermissionKeys()),
        ]);

        $adminRole->update([
            'name'        => $data['name'],
            'permissions' => $data['permissions'] ?? [],
        ]);

        return redirect('/admin/roles/' . $adminRole->id)
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(AdminRole $adminRole)
    {
        $adminRole->delete();
        return redirect('/admin/roles')->with('success', 'Role deleted.');
    }
}
