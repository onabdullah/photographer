<?php

namespace App\Jobs;

use App\Mail\Admin\MagicEraserSettingsChangedMail;
use App\Models\AdminUser;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

/**
 * Send security notification email when Magic Eraser settings change.
 *
 * Triggered on any settings update or reset.
 */
class SendMagicEraserSettingsSecurityEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected AdminUser|User $admin,
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
                new MagicEraserSettingsChangedMail(
                    $this->admin,
                    $this->changes,
                    $this->isReset
                )
            );
        }
    }
}
