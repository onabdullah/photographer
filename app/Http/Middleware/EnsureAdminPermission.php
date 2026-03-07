<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminPermission
{
    /**
     * Ensure the authenticated admin user has the given permission.
     * Use in admin routes: ->middleware('admin.permission:dashboard.view')
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user('admin');

        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        if (! $user->can($permission)) {
            abort(403, 'You do not have permission to perform this action.');
        }

        return $next($request);
    }
}
