<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Admin\TeamUserCreatedNotificationMail;
use App\Mail\Admin\TeamUserCredentialsMail;
use App\Models\AdminRole;
use App\Models\User;
use App\Services\MailService;
use App\Services\AdminActivityNotifier;
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
            'user'  => $user->only(['id', 'name', 'email', 'admin_role_id', 'status']),
            'roles' => AdminRole::select('id', 'name')->get(),
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Pages/Users/Create', [
            'roles' => AdminRole::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $actor = $request->user('admin') ?? $request->user();

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'admin_role_id' => 'required|exists:admin_roles,id',
            'status'        => 'required|in:active,inactive',
        ]);

        $adminRole = AdminRole::findOrFail((int) $data['admin_role_id']);
        $systemRole = $this->resolveSystemRoleFromAdminRole($adminRole);
        $generatedPassword = $this->generateStrongPassword();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $generatedPassword,
            'role' => $systemRole,
            'admin_role_id' => $adminRole->id,
            'status' => $data['status'],
            // Keep null so UI/security policy can enforce password change workflow.
            'password_updated_at' => null,
            'email_verified_at' => now(),
        ]);

        $this->notifyOnTeamUserCreated($actor, $user, $adminRole, $generatedPassword);

        AdminActivityNotifier::notify(
            action: 'Team user created',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'target_user_id' => $user->id,
                'target_user_email' => $user->email,
                'custom_role' => $adminRole->name,
                'status' => $user->status,
            ],
        );

        return redirect('/admin/users/' . $user->id)
            ->with('success', 'Team user created successfully. Login instructions were sent by email.');
    }

    public function update(Request $request, User $user)
    {
        $actor = $request->user('admin') ?? $request->user();
        $previous = $user->only(['name', 'email', 'role', 'admin_role_id', 'status']);

        $data = $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email,' . $user->id,
            'admin_role_id' => 'required|exists:admin_roles,id',
            'status'        => 'required|in:active,inactive',
        ]);

        $adminRole = AdminRole::findOrFail((int) $data['admin_role_id']);
        $data['role'] = $this->resolveSystemRoleFromAdminRole($adminRole);

        $user->update($data);

        AdminActivityNotifier::notify(
            action: 'Admin user updated',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'target_user_id' => $user->id,
                'target_user_email' => $user->email,
                'before' => $previous,
                'after' => $user->fresh()->only(['name', 'email', 'role', 'admin_role_id', 'status']),
            ],
        );

        return redirect('/admin/users/' . $user->id)
            ->with('success', 'User updated successfully.');
    }

    public function updateStatus(Request $request, User $user)
    {
        $actor = $request->user('admin') ?? $request->user();
        $previousStatus = $user->status;
        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);

        AdminActivityNotifier::notify(
            action: 'Admin user status changed',
            actorName: $actor?->name ?? 'System',
            actorEmail: $actor?->email,
            details: [
                'target_user_id' => $user->id,
                'target_user_email' => $user->email,
                'previous_status' => $previousStatus,
                'new_status' => $newStatus,
            ],
        );

        return back()->with('success', 'User status updated.');
    }

    private function resolveSystemRoleFromAdminRole(AdminRole $adminRole): string
    {
        $permissions = $adminRole->permissions ?? [];
        return in_array('*', $permissions, true) ? 'super_admin' : 'admin';
    }

    private function generateStrongPassword(int $length = 12): string
    {
        $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!%*?';
        $max = strlen($alphabet) - 1;
        $password = '';
        for ($i = 0; $i < $length; $i++) {
            $password .= $alphabet[random_int(0, $max)];
        }
        return $password;
    }

    private function notifyOnTeamUserCreated($actor, User $newUser, AdminRole $adminRole, string $generatedPassword): void
    {
        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            return;
        }

        // 1) Notify creator + all super-admin recipients (deduplicated).
        $recipientEmails = User::query()
            ->where('status', 'active')
            ->whereNotNull('email')
            ->where(function ($q) {
                $q->where('role', 'super_admin')
                    ->orWhereHas('adminRole', function ($roleQ) {
                        $roleQ->whereJsonContains('permissions', '*')
                            ->orWhereJsonContains('permissions', 'settings.smtp');
                    });
            })
            ->pluck('email')
            ->filter()
            ->values()
            ->all();

        if (! empty($actor?->email)) {
            $recipientEmails[] = $actor->email;
        }
        $recipientEmails = array_values(array_unique($recipientEmails));

        foreach ($recipientEmails as $email) {
            MailService::send(
                toAddress: $email,
                mailable: new TeamUserCreatedNotificationMail(
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    createdUserName: $newUser->name,
                    createdUserEmail: $newUser->email,
                    createdUserStatus: $newUser->status,
                    customRoleName: $adminRole->name,
                    createdByName: $actor?->name ?? 'System',
                    createdByEmail: $actor?->email,
                ),
                subject: 'Team user created — ' . $newUser->name,
            );
        }

        // 2) Notify newly added team user with temporary password and security guidance.
        MailService::send(
            toAddress: $newUser->email,
            mailable: new TeamUserCredentialsMail(
                fromAddress: $smtp->from_address,
                fromName: $smtp->from_name,
                userName: $newUser->name,
                userEmail: $newUser->email,
                temporaryPassword: $generatedPassword,
                customRoleName: $adminRole->name,
            ),
            subject: 'Your team account access — ' . config('app.name'),
        );
    }
}
