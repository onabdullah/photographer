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
        \Log::channel('single')->info('Role update started', [
            'role_id' => $adminRole->id,
            'role_name' => $adminRole->name,
            'request_data' => $request->all(),
        ]);

        try {
            $actor = $request->user('admin') ?? $request->user();
            $before = $adminRole->only(['name', 'permissions']);

            \Log::channel('single')->info('Role update - Before validation', [
                'role_id' => $adminRole->id,
                'before_data' => $before,
            ]);

            $data = $request->validate([
                'name'          => 'required|string|max:255',
                'permissions'   => 'array',
                'permissions.*' => 'string|in:' . implode(',', AdminRole::allPermissionKeys()),
            ]);

            \Log::channel('single')->info('Role update - Validation passed', [
                'role_id' => $adminRole->id,
                'validated_data' => $data,
            ]);

            $adminRole->update([
                'name'        => $data['name'],
                'permissions' => $data['permissions'] ?? [],
            ]);

            \Log::channel('single')->info('Role update - Database updated', [
                'role_id' => $adminRole->id,
                'after_data' => $adminRole->fresh()->only(['name', 'permissions']),
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

            \Log::channel('single')->info('Role update - Success', [
                'role_id' => $adminRole->id,
            ]);

            return redirect('/admin/roles/' . $adminRole->id)
                ->with('success', 'Role updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::channel('single')->error('Role update - Validation failed', [
                'role_id' => $adminRole->id,
                'errors' => $e->errors(),
                'request_data' => $request->all(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            \Log::channel('single')->error('Role update - Exception occurred', [
                'role_id' => $adminRole->id,
                'error_message' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            throw $e;
        }
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
