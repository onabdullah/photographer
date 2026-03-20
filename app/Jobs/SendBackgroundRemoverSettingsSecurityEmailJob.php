<?php

namespace App\Jobs;

use App\Mail\Admin\BackgroundRemoverSettingsChangedMail;
use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

/**
 * Send security notification email when Background Remover settings change.
 *
 * Triggered on any settings update or reset.
 */
class SendBackgroundRemoverSettingsSecurityEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected AdminUser $admin,
        protected array $changes = [],
        protected bool $isReset = false,
    ) {
    }

    public function handle(): void
    {
        // Send to super-admin only
        $superAdmins = AdminUser::whereHas('roles', function ($q) {
            $q->where('name', 'superadmin');
        })->get();

        foreach ($superAdmins as $superAdmin) {
            Mail::to($superAdmin->email)->send(
                new BackgroundRemoverSettingsChangedMail(
                    $this->admin,
                    $this->changes,
                    $this->isReset
                )
            );
        }
    }
}
