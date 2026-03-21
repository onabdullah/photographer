<?php

namespace App\Jobs;

use App\Mail\Admin\LightingFixSettingsChangedMail;
use App\Models\AdminUser;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendLightingFixSettingsSecurityEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public AdminUser $admin,
        public array $changes,
        public bool $isReset = false,
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        // Find all super-admins to notify
        $superAdmins = AdminUser::whereHas('adminRoles', function ($query) {
            $query->where('code', 'super_admin');
        })->get();

        foreach ($superAdmins as $superAdmin) {
            Mail::to($superAdmin->email)->send(
                new LightingFixSettingsChangedMail($this->admin, $this->changes, $this->isReset)
            );
        }
    }
}
