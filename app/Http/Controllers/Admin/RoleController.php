<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminRole;
use App\Services\AdminActivityNotifier;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $paginator = AdminRole::withCount('users')
            ->latest()
            ->paginate(15);

        $roles = collect($paginator->items())->map(fn ($r) => [
            'id'               => $r->id,
            'name'             => $r->name,
            'permissions_count'=> $r->permissions_count,
            'users_count'      => $r->users_count,
            'created_at'       => $r->created_at?->toIso8601String(),
        ])->all();

        return Inertia::render('Admin/Pages/Roles/Index', [
            'roles'           => $roles,
            'totalPermissions'=> count(AdminRole::allPermissionKeys()),
            'rolesPaginator'  => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'prev_page_url'=> $paginator->previousPageUrl(),
                'next_page_url'=> $paginator->nextPageUrl(),
            ],
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
        $actor = $request->user('admin') ?? $request->user();
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'string|in:' . implode(',', AdminRole::allPermissionKeys()),
        ]);

        $role = AdminRole::create([
            'name'        => $data['name'],
            'permissions' => $data['permissions'] ?? [],
        ]);

        AdminActivityNotifier::notify(
            action: 'Admin role created',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'role_id' => $role->id,
                'role_name' => $role->name,
                'permissions_count' => count($role->permissions ?? []),
            ],
        );

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
        $actor = $request->user('admin') ?? $request->user();
        $before = $adminRole->only(['name', 'permissions']);

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'permissions'   => 'array',
            'permissions.*' => 'string|in:' . implode(',', AdminRole::allPermissionKeys()),
        ]);

        $adminRole->update([
            'name'        => $data['name'],
            'permissions' => $data['permissions'] ?? [],
        ]);

        AdminActivityNotifier::notify(
            action: 'Admin role updated',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'role_id' => $adminRole->id,
                'before' => $before,
                'after' => $adminRole->fresh()->only(['name', 'permissions']),
            ],
        );

        return redirect('/admin/roles/' . $adminRole->id)
            ->with('success', 'Role updated successfully.');
    }

    public function destroy(AdminRole $adminRole)
    {
        $actor = request()->user('admin') ?? request()->user();
        $details = $adminRole->only(['id', 'name', 'permissions']);
        $adminRole->delete();

        AdminActivityNotifier::notify(
            action: 'Admin role deleted',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'role_id' => $details['id'] ?? null,
                'role_name' => $details['name'] ?? null,
                'permissions_count' => count($details['permissions'] ?? []),
            ],
        );

        return redirect('/admin/roles')->with('success', 'Role deleted.');
    }
}
