<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     * On admin routes, reads from the 'admin' guard so the layout
     * sees the logged-in admin including their role + permissions.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->routeIs('admin.*')
            ? $request->user('admin')
            : $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'          => $user->id,
                    'name'        => $user->name,
                    'email'       => $user->email,
                    'role'        => $user->role ?? 'super_admin',
                    'permissions' => $user->permissions ?? ['*'],
                ] : null,
            ],
            'appEnv' => config('app.env'),
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
