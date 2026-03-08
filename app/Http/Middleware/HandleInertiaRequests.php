<?php

namespace App\Http\Middleware;

use App\Models\AiStudioToolSetting;
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

        $shared = [
            ...parent::share($request),
            // Expose token for frontend; app.jsx injects it into every non-GET Inertia request (permanent 419 fix).
            'csrf_token' => fn () => csrf_token(),
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

        // Shopify app: whether Product AI Lab (VTO) is visible (admin "Show on store" vs "Hidden")
        if ($request->routeIs('shopify.*')) {
            $shared['showProductAILab'] = (bool) (AiStudioToolSetting::where('tool_key', 'universal_generate')->value('is_enabled') ?? true);
        }

        return $shared;
    }
}
