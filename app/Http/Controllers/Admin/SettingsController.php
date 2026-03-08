<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\SmtpTestMail;
use App\Models\MailLog;
use App\Models\SmtpSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

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
        if ($canManageSmtp) {
            $purposes = SmtpSetting::purposes();
            $smtpPurposes = $purposes;
            $smtpEncryptionOptions = SmtpSetting::encryptionOptions();
            $settings = SmtpSetting::orderBy('purpose')->orderBy('name')->get();
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

        return Inertia::render('Admin/Pages/Settings', [
            'smtpSettings' => $smtpSettings,
            'smtpPurposes' => $smtpPurposes,
            'smtpEncryptionOptions' => $smtpEncryptionOptions,
            'recentMailLogs' => $recentMailLogs,
            'canManageSmtp' => $canManageSmtp,
            'canManageSettings' => $canManageSettings,
        ]);
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
