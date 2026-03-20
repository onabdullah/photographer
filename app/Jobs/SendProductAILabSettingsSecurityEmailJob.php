<?php

namespace App\Jobs;

use App\Mail\Admin\ProductAILabSettingsChangedMail;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendProductAILabSettingsSecurityEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 60;

    public function __construct(
        protected User $admin,
        protected array $changes,
        protected bool $isReset = false,
    ) {}

    public function handle(): void
    {
        try {
            // Find super admin (user with highest privilege)
            $superAdmin = User::where('role', 'super_admin')
                ->orWhere('role', 'SuperAdmin')
                ->first();

            if (!$superAdmin || !$superAdmin->email) {
                Log::channel('admin')->warning('No super admin email found for Product AI Lab settings change notification');
                return;
            }

            // Send email to super admin
            $mailable = new ProductAILabSettingsChangedMail(
                $this->admin,
                $this->changes,
                $this->isReset
            );

            SendMailJob::dispatch(
                $superAdmin->email,
                $mailable,
                'Product AI Lab Settings Changed'
            );
        } catch (\Throwable $e) {
            Log::channel('admin')->error('Failed to dispatch Product AI Lab settings change email', [
                'error' => $e->getMessage(),
                'admin' => $this->admin->email,
            ]);
        }
    }
}
