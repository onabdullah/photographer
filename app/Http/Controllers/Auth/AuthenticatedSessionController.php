<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\LoginLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::guard('admin')->user();
        if ($user && $user->hasTwoFactorEnabled()) {
            $request->session()->put('2fa:user_id', $user->id);
            Auth::guard('admin')->logout();
            $request->session()->regenerate();
            return redirect()->route('login.two-factor', [], 303);
        }

        if ($user) {
            LoginLogService::logSuccess($request, $user);
        }
        $request->session()->regenerate();
        return redirect()->route('admin.dashboard', [], 303);
    }

    public function showTwoFactorChallenge(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('2fa:user_id')) {
            return redirect()->route('login', [], 303);
        }
        return Inertia::render('Auth/TwoFactorChallenge');
    }

    public function storeTwoFactorChallenge(Request $request): RedirectResponse
    {
        $userId = $request->session()->get('2fa:user_id');
        if (! $userId) {
            return redirect()->route('login', [], 303)->with('error', 'Session expired. Please log in again.');
        }
        $user = User::find($userId);
        if (! $user) {
            $request->session()->forget('2fa:user_id');
            return redirect()->route('login', [], 303)->with('error', 'Invalid session.');
        }
        $request->validate(['code' => 'required|string|size:6']);
        $code = preg_replace('/\D/', '', $request->input('code'));
        $secret = $user->two_factor_secret;
        if (! $secret) {
            $request->session()->forget('2fa:user_id');
            return redirect()->route('login', [], 303)->with('error', 'Two-factor is not enabled.');
        }
        $google2fa = new Google2FA;
        if (! $google2fa->verifyKey($secret, $code)) {
            return back()->withErrors(['code' => __('The provided two factor authentication code was invalid.')]);
        }
        $request->session()->forget('2fa:user_id');
        Auth::guard('admin')->login($user);
        LoginLogService::logSuccess($request, $user);
        $request->session()->regenerate();
        return redirect()->route('admin.dashboard', [], 303);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::guard('admin')->user() ?? Auth::guard('web')->user();

        if ($user) {
            LoginLogService::logLogout($request, $user);
        }

        Auth::guard('admin')->logout();
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login', [], 303);
    }
}
