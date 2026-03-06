<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminRole;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('adminRole')
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/Pages/Users/Index', [
            'users' => $users->through(fn ($u) => [
                'id'           => $u->id,
                'name'         => $u->name,
                'email'        => $u->email,
                'role'         => $u->role,
                'admin_role'   => $u->adminRole ? ['id' => $u->adminRole->id, 'name' => $u->adminRole->name] : null,
                'status'       => $u->status ?? 'active',
                'created_at'   => $u->created_at?->toIso8601String(),
                'last_login_at'=> $u->last_login_at?->toIso8601String(),
            ]),
        ]);
    }

    public function show(User $user)
    {
        $user->load('adminRole');
        $permissions = $user->adminRole?->permissions ?? $user->permissions ?? [];

        return Inertia::render('Admin/Pages/Users/Show', [
            'user' => [
                'id'              => $user->id,
                'name'            => $user->name,
                'email'           => $user->email,
                'role'            => $user->role,
                'admin_role'      => $user->adminRole
                    ? [
                        'id'          => $user->adminRole->id,
                        'name'        => $user->adminRole->name,
                        'permissions' => $user->adminRole->permissions ?? [],
                      ]
                    : null,
                'status'          => $user->status ?? 'active',
                'created_at'      => $user->created_at?->format('M j, Y \a\t g:i A'),
                'last_login_at'   => $user->last_login_at?->format('M j, Y \a\t g:i A'),
                'email_verified_at'=> $user->email_verified_at?->format('M j, Y'),
                'permissions'     => $permissions,
            ],
            'allPermissions' => AdminRole::ALL_PERMISSIONS,
            'roles'          => AdminRole::select('id', 'name')->get(),
        ]);
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Pages/Users/Edit', [
            'user'  => $user->only(['id', 'name', 'email', 'role', 'admin_role_id', 'status']),
            'roles' => AdminRole::select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email,' . $user->id,
            'role'          => 'required|in:super_admin,admin,viewer',
            'admin_role_id' => 'nullable|exists:admin_roles,id',
            'status'        => 'required|in:active,inactive',
        ]);

        $user->update($data);

        return redirect('/admin/users/' . $user->id)
            ->with('success', 'User updated successfully.');
    }

    public function updateStatus(Request $request, User $user)
    {
        $user->update(['status' => $user->status === 'active' ? 'inactive' : 'active']);
        return back()->with('success', 'User status updated.');
    }
}
