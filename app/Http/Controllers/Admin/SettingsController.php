<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SmtpTestMail;
use App\Models\LoginLog;
use App\Models\MailLog;
use App\Models\SiteSetting;
use App\Models\SmtpSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use PragmaRX\Google2FA\Google2FA;

class SettingsController extends Controller
{
    /** Allow super_admin or user with settings.smtp permission. */
    private function ensureCanManageSmtp(): void
    {
        $user = auth()->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }
        if ($user->can('settings.smtp')) {
            return;
        }
        abort(403, 'You do not have permission to manage SMTP settings.');
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $canManageSmtp = $user && $user->can('settings.smtp');
        $canManageSettings = $user && $user->can('settings.manage');

        $smtpSettings = [];
        $smtpPurposes = [];
        $smtpEncryptionOptions = [];
        $recentMailLogs = [];
        $mailOverviewStats = null;
        if ($canManageSmtp) {
            $purposes = SmtpSetting::purposes();
            $smtpPurposes = $purposes;
            $smtpEncryptionOptions = SmtpSetting::encryptionOptions();
            $settings = SmtpSetting::orderBy('purpose')->orderBy('name')->get();

            $totalSent = MailLog::count();
            $totalFailed = (int) MailLog::where('status', MailLog::STATUS_FAILED)->count();
            $totalSuccess = (int) MailLog::where('status', MailLog::STATUS_SENT)->count();
            $errorPct = $totalSent > 0 ? round(($totalFailed / $totalSent) * 100, 1) : 0;
            $topError = MailLog::where('status', MailLog::STATUS_FAILED)
                ->whereNotNull('error_message')
                ->selectRaw('error_message, count(*) as cnt')
                ->groupBy('error_message')
                ->orderByDesc('cnt')
                ->first();

            $smtpSettings = $settings->map(function (SmtpSetting $s) {
                $successCount = $s->mailLogs()->where('status', MailLog::STATUS_SENT)->count();
                $failedCount = $s->mailLogs()->where('status', MailLog::STATUS_FAILED)->count();
                $totalSent = $successCount + $failedCount;
                $avgMs = $s->mailLogs()->whereNotNull('duration_ms')->avg('duration_ms');
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'purpose' => $s->purpose,
                    'host' => $s->host,
                    'port' => $s->port,
                    'encryption' => $s->encryption,
                    'username' => $s->username,
                    'from_address' => $s->from_address,
                    'from_name' => $s->from_name,
                    'is_active' => $s->is_active,
                    'total_sent' => (int) $totalSent,
                    'success_count' => (int) $successCount,
                    'failed_count' => (int) $failedCount,
                    'avg_sent_time_ms' => $avgMs !== null ? (int) round($avgMs) : null,
                ];
            })->values()->all();

            $bestSmtpEntry = collect($smtpSettings)
                ->filter(fn ($s) => ($s['total_sent'] ?? 0) > 0)
                ->map(fn ($s) => [
                    'label' => $s['name'] ?: ($purposes[$s['purpose']] ?? $s['purpose']),
                    'success_rate' => (int) round((($s['success_count'] ?? 0) / $s['total_sent']) * 100),
                    'total' => $s['total_sent'],
                ])
                ->sortByDesc('success_rate')
                ->first();

            $mailOverviewStats = [
                'total_sent' => $totalSent,
                'total_success' => $totalSuccess,
                'total_failed' => $totalFailed,
                'blocked' => $totalFailed,
                'error_percentage' => $errorPct,
                'top_error' => $topError ? [
                    'message' => \Str::limit($topError->error_message, 80),
                    'message_full' => $topError->error_message,
                    'count' => (int) $topError->cnt,
                ] : null,
                'best_smtp' => $bestSmtpEntry ? [
                    'label' => $bestSmtpEntry['label'],
                    'success_rate' => $bestSmtpEntry['success_rate'],
                    'total' => $bestSmtpEntry['total'],
                ] : null,
            ];

            $recentMailLogs = MailLog::with('smtpSetting')
                ->latest('sent_at')
                ->take(50)
                ->get()
                ->map(function (MailLog $log) use ($purposes) {
                    $smtp = $log->smtpSetting;
                    $label = $smtp ? ($smtp->name ?: ($purposes[$smtp->purpose] ?? $smtp->purpose)) : '—';
                    return [
                        'id' => $log->id,
                        'to_address' => $log->to_address,
                        'status' => $log->status,
                        'sent_at' => $log->sent_at->toIso8601String(),
                        'duration_ms' => $log->duration_ms,
                        'error_message' => $log->error_message,
                        'smtp_label' => $label,
                    ];
                })
                ->values()
                ->all();
        }

        $appName = SiteSetting::get(SiteSetting::KEY_APP_NAME, config('app.name'));
        $appLogoUrl = SiteSetting::getAppLogoUrl();
        $footerText = SiteSetting::get(SiteSetting::KEY_FOOTER_TEXT);
        $socialLinks = SiteSetting::getSocialLinks();
        $passwordExpiryDays = SiteSetting::getPasswordExpiryDays();

        $currentUser = $user ? $user->loadMissing([]) : null;
        $passwordUpdatedAt = $currentUser?->password_updated_at?->toIso8601String();
        $isDefaultPassword = $currentUser && $currentUser->password_updated_at === null;
        $passwordChangeRequired = false;
        if ($currentUser && $passwordExpiryDays > 0 && $currentUser->password_updated_at) {
            $expiresAt = $currentUser->password_updated_at->addDays($passwordExpiryDays);
            $passwordChangeRequired = $expiresAt->isPast();
        } elseif ($isDefaultPassword) {
            $passwordChangeRequired = true;
        }
        $twoFaEnabled = $currentUser?->hasTwoFactorEnabled() ?? false;

        $loginLogsQuery = LoginLog::query()->latest();
        if ($request->filled('log_status')) {
            $loginLogsQuery->where('status', $request->input('log_status'));
        }
        if ($request->filled('log_event_type')) {
            $loginLogsQuery->where('event_type', $request->input('log_event_type'));
        }
        if ($request->filled('log_email')) {
            $loginLogsQuery->where('email', 'like', '%' . $request->input('log_email') . '%');
        }
        if ($request->filled('log_ip')) {
            $loginLogsQuery->where('ip_address', 'like', '%' . $request->input('log_ip') . '%');
        }
        if ($request->filled('log_date_from')) {
            $loginLogsQuery->whereDate('created_at', '>=', $request->input('log_date_from'));
        }
        if ($request->filled('log_date_to')) {
            $loginLogsQuery->whereDate('created_at', '<=', $request->input('log_date_to'));
        }
        $loginLogs = $loginLogsQuery->paginate(20)->withQueryString()->through(function (LoginLog $log) {
            return [
                'id'               => $log->id,
                'user_id'          => $log->user_id,
                'email'            => $log->email,
                'ip_address'       => $log->ip_address,
                'user_agent'       => $log->user_agent,
                'status'           => $log->status,
                'event_type'       => $log->event_type ?? 'login',
                'location'         => $log->location,
                'country'          => $log->country,
                'city'             => $log->city,
                'browser'          => $log->browser,
                'os'               => $log->os,
                'device_type'      => $log->device_type,
                'risk_percentage'  => $log->risk_percentage,
                'created_at'       => $log->created_at->toIso8601String(),
            ];
        });

        $loginLogStats = [
            'total'     => LoginLog::count(),
            'success'   => (int) LoginLog::where('status', LoginLog::STATUS_SUCCESS)->where('event_type', LoginLog::EVENT_LOGIN)->count(),
            'failed'    => (int) LoginLog::where('status', LoginLog::STATUS_FAILED)->count(),
            'logout'    => (int) LoginLog::where('event_type', LoginLog::EVENT_LOGOUT)->count(),
            'high_risk' => (int) LoginLog::where('risk_percentage', '>=', 70)->count(),
            'last_24h'  => (int) LoginLog::where('created_at', '>=', now()->subDay())->count(),
        ];

        return Inertia::render('Admin/Pages/Settings', [
            'smtpSettings' => $smtpSettings,
            'smtpPurposes' => $smtpPurposes,
            'smtpEncryptionOptions' => $smtpEncryptionOptions,
            'recentMailLogs' => $recentMailLogs,
            'mailOverviewStats' => $mailOverviewStats,
            'canManageSmtp' => $canManageSmtp,
            'canManageSettings' => $canManageSettings,
            'general' => [
                'app_name' => $appName,
                'app_logo_url' => $appLogoUrl,
                'footer_text' => $footerText,
                'social_links' => $socialLinks,
            ],
            'security' => [
                'password_expiry_days' => $passwordExpiryDays,
                'password_updated_at' => $passwordUpdatedAt,
                'is_default_password' => $isDefaultPassword,
                'password_change_required' => $passwordChangeRequired,
                'two_fa_enabled' => $twoFaEnabled,
            ],
            'loginLogs' => $loginLogs,
            'loginLogStats' => $loginLogStats,
            'logFilters' => [
                'log_status'     => $request->input('log_status'),
                'log_event_type' => $request->input('log_event_type'),
                'log_email'      => $request->input('log_email'),
                'log_ip'         => $request->input('log_ip'),
                'log_date_from'  => $request->input('log_date_from'),
                'log_date_to'    => $request->input('log_date_to'),
            ],
            'two_factor_qr_url' => $request->session()->get('two_factor_qr_url'),
            'two_factor_secret' => $request->session()->get('two_factor_secret'),
        ]);
    }

    /** Update general settings (logo, app name). Requires settings.manage. */
    public function updateGeneral(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user || ! $user->can('settings.manage')) {
            abort(403, 'You do not have permission to manage general settings.');
        }

        $valid = $request->validate([
            'app_name' => 'nullable|string|max:128',
            'logo' => 'nullable|image|mimes:jpeg,png,gif,webp,svg|max:2048',
            'footer_text' => 'nullable|string|max:500',
            'social_links' => 'nullable',
            'social_links_json' => 'nullable|string',
        ]);
        $socialLinks = [];
        $raw = $request->input('social_links_json') ?: $request->input('social_links');
        if (is_string($raw)) {
            $decoded = is_string($raw) && (str_starts_with(trim($raw), '{') || str_starts_with(trim($raw), '[')) ? json_decode($raw, true) : null;
            if (is_array($decoded)) {
                foreach ($decoded as $k => $v) {
                    if (is_string($v) && $v !== '' && filter_var($v, FILTER_VALIDATE_URL)) {
                        $socialLinks[$k] = $v;
                    }
                }
            }
        } elseif (is_array($raw)) {
            foreach ($raw as $k => $v) {
                if (is_string($v) && $v !== '' && filter_var($v, FILTER_VALIDATE_URL)) {
                    $socialLinks[$k] = $v;
                }
            }
        }

        if (array_key_exists('app_name', $valid)) {
            SiteSetting::set(SiteSetting::KEY_APP_NAME, $valid['app_name'] ?: null);
        }
        if (array_key_exists('footer_text', $valid)) {
            SiteSetting::set(SiteSetting::KEY_FOOTER_TEXT, $valid['footer_text'] ?: null);
        }
        if ($request->has('social_links') || $request->has('social_links_json')) {
            SiteSetting::setSocialLinks($socialLinks);
        }

        if ($request->hasFile('logo')) {
            $dir = 'site';
            $file = $request->file('logo');
            $ext = $file->getClientOriginalExtension() ?: 'png';
            $path = $file->storeAs($dir, 'logo.' . $ext, 'public');
            $oldPath = SiteSetting::get(SiteSetting::KEY_APP_LOGO);
            if ($oldPath && $oldPath !== $path) {
                Storage::disk('public')->delete($oldPath);
            }
            SiteSetting::set(SiteSetting::KEY_APP_LOGO, $path);
        }

        return redirect()->route('admin.settings')->with('success', 'General settings updated.');
    }

    /** Update the authenticated admin user's password. */
    public function updatePassword(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        $valid = $request->validate([
            'current_password' => [
                'required',
                function (string $attr, $value, \Closure $fail) use ($user) {
                    if (! Hash::check($value, $user->getAuthPassword())) {
                        $fail(__('The current password is incorrect.'));
                    }
                },
            ],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->update([
            'password' => Hash::make($valid['password']),
            'password_updated_at' => now(),
        ]);

        return redirect()->route('admin.settings')->with('success', 'Password updated.');
    }

    /** Update security policy (password expiry days). Requires settings.manage. */
    public function updateSecurity(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user || ! $user->can('settings.manage')) {
            abort(403, 'You do not have permission to manage security settings.');
        }
        $valid = $request->validate([
            'password_expiry_days' => 'nullable|integer|min:0|max:365',
        ]);
        $days = isset($valid['password_expiry_days']) ? (int) $valid['password_expiry_days'] : 0;
        SiteSetting::set(SiteSetting::KEY_PASSWORD_EXPIRY_DAYS, (string) $days);
        return redirect()->route('admin.settings')->with('success', 'Security settings updated.');
    }

    /** Start 2FA setup: generate secret and return QR URL. Requires authenticated user. */
    public function twoFactorSetup(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }
        if ($user->hasTwoFactorEnabled()) {
            return redirect()->route('admin.settings', [], 303)->with('error', 'Two-factor authentication is already enabled.');
        }
        $google2fa = new Google2FA;
        $secret = $google2fa->generateSecretKey(32);
        $appName = SiteSetting::get(SiteSetting::KEY_APP_NAME, config('app.name'));
        $qrCodeUrl = $google2fa->getQRCodeUrl($appName, $user->email, $secret);
        $request->session()->put('two_factor_pending_secret', $secret);
        $request->session()->put('two_factor_qr_url', $qrCodeUrl);
        $request->session()->put('two_factor_secret', $secret);

        return redirect()->route('admin.settings', ['tab' => 'security'], 303);
    }

    /** Confirm 2FA with a one-time code and enable it. */
    public function twoFactorConfirm(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }
        $secret = $request->session()->get('two_factor_pending_secret');
        if (! $secret) {
            return redirect()->route('admin.settings', ['tab' => 'security'], 303)->with('error', 'Please start 2FA setup again.');
        }
        $valid = $request->validate(['code' => 'required|string|size:6']);
        $code = preg_replace('/\D/', '', $valid['code']);
        $google2fa = new Google2FA;
        if (! $google2fa->verifyKey($secret, $code)) {
            return redirect()->route('admin.settings', ['tab' => 'security'], 303)->with('error', 'Invalid or expired code. Try again.');
        }
        $request->session()->forget(['two_factor_pending_secret', 'two_factor_qr_url', 'two_factor_secret']);
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ]);
        return redirect()->route('admin.settings', ['tab' => 'security'], 303)->with('success', 'Two-factor authentication is now enabled.');
    }

    /** Disable 2FA. Requires current password. */
    public function twoFactorDisable(Request $request)
    {
        $user = auth()->guard('admin')->user();
        if (! $user) {
            abort(403, 'Unauthenticated.');
        }
        $request->validate([
            'current_password' => [
                'required',
                function (string $attr, $value, \Closure $fail) use ($user) {
                    if (! Hash::check($value, $user->getAuthPassword())) {
                        $fail(__('The current password is incorrect.'));
                    }
                },
            ],
        ]);
        $user->update([
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
        ]);
        $request->session()->forget(['two_factor_pending_secret', 'two_factor_qr_url', 'two_factor_secret']);
        return redirect()->route('admin.settings', ['tab' => 'security'], 303)->with('success', 'Two-factor authentication has been disabled.');
    }

    public function storeSmtp(Request $request)
    {
        $this->ensureCanManageSmtp();

        $valid = $request->validate([
            'name' => 'nullable|string|max:128',
            'purpose' => 'required|string|in:support,marketing,general',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'encryption' => 'nullable|string|in:tls,ssl',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'from_address' => 'required|email',
            'from_name' => 'nullable|string|max:128',
            'is_active' => 'boolean',
        ]);

        $valid['is_active'] = $request->boolean('is_active');
        $valid['encryption'] = $request->input('encryption') ?: null;
        if (empty($valid['password'])) {
            unset($valid['password']);
        }

        SmtpSetting::create($valid);

        return redirect()->route('admin.settings')->with('success', 'SMTP configuration added.');
    }

    public function updateSmtp(Request $request, SmtpSetting $smtpSetting)
    {
        $this->ensureCanManageSmtp();

        $valid = $request->validate([
            'name' => 'nullable|string|max:128',
            'purpose' => 'required|string|in:support,marketing,general',
            'host' => 'required|string|max:255',
            'port' => 'required|integer|min:1|max:65535',
            'encryption' => 'nullable|string|in:tls,ssl',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'from_address' => 'required|email',
            'from_name' => 'nullable|string|max:128',
            'is_active' => 'boolean',
        ]);

        $valid['is_active'] = $request->boolean('is_active');
        $valid['encryption'] = $request->input('encryption') ?: null;
        if (empty($valid['password'])) {
            unset($valid['password']);
        }

        $smtpSetting->update($valid);

        return redirect()->route('admin.settings')->with('success', 'SMTP configuration updated.');
    }

    public function destroySmtp(SmtpSetting $smtpSetting)
    {
        $this->ensureCanManageSmtp();
        $smtpSetting->delete();
        return redirect()->route('admin.settings')->with('success', 'SMTP configuration removed.');
    }

    public function setActiveSmtp(SmtpSetting $smtpSetting)
    {
        $this->ensureCanManageSmtp();
        $smtpSetting->update(['is_active' => true]);
        return redirect()->route('admin.settings')->with('success', 'SMTP set as active for this purpose.');
    }

    public function testSmtp(Request $request)
    {
        $this->ensureCanManageSmtp();

        $request->validate(['test_email' => 'required|email']);

        $id = $request->input('id');
        $smtp = SmtpSetting::findOrFail($id);

        $mailerName = 'smtp_test_' . $id;
        Config::set("mail.mailers.{$mailerName}", [
            'transport' => 'smtp',
            'host' => $smtp->host,
            'port' => (int) $smtp->port,
            'encryption' => $smtp->encryption,
            'username' => $smtp->username,
            'password' => $smtp->password,
            'timeout' => null,
        ]);

        $toAddress = $request->test_email;
        $start = microtime(true);
        $subject = 'SMTP test – ' . config('app.name');

        try {
            Mail::mailer($mailerName)
                ->to($toAddress)
                ->send(new SmtpTestMail(
                    SmtpSetting::purposes()[$smtp->purpose] ?? $smtp->purpose,
                    $smtp->from_address,
                    $smtp->from_name
                ));
            $durationMs = (int) round((microtime(true) - $start) * 1000);
            MailLog::create([
                'smtp_setting_id' => $smtp->id,
                'to_address' => $toAddress,
                'subject' => $subject,
                'status' => MailLog::STATUS_SENT,
                'duration_ms' => $durationMs,
                'error_message' => null,
                'sent_at' => now(),
            ]);
            return redirect()->route('admin.settings')
                ->with('success', 'Test email sent to ' . $toAddress);
        } catch (\Throwable $e) {
            $durationMs = (int) round((microtime(true) - $start) * 1000);
            MailLog::create([
                'smtp_setting_id' => $smtp->id,
                'to_address' => $toAddress,
                'subject' => $subject,
                'status' => MailLog::STATUS_FAILED,
                'duration_ms' => $durationMs,
                'error_message' => $e->getMessage(),
                'sent_at' => now(),
            ]);
            return redirect()->route('admin.settings')
                ->with('error', 'Test failed: ' . $e->getMessage());
        }
    }
}
