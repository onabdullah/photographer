<?php

namespace App\Jobs;

use App\Mail\Admin\UpscalerSettingsChangedMail;
use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendUpscalerSettingsSecurityEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $adminId,
        public array $changes,
        public bool $isReset = false,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Get the admin user who made the change
        $admin = AdminUser::find($this->adminId);
        if (!$admin) {
            return;
        }

        // Find all super-admins to notify
        $superAdmins = AdminUser::whereHas('adminRoles', function ($query) {
            $query->where('code', 'super_admin');
        })->get();

        foreach ($superAdmins as $superAdmin) {
            Mail::to($superAdmin->email)->send(
                new UpscalerSettingsChangedMail($admin, $this->changes, $this->isReset)
            );
        }
    }
}
