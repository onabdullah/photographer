<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ScrubMerchantEmailLogs implements ShouldQueue
{
    use Queueable;


    public $merchantId;

    /**
     * Create a new job instance.
     */
    public function __construct($merchantId)
    {
        $this->merchantId = $merchantId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \App\Models\EmailLog::where('merchant_id', $this->merchantId)
            ->update(['sent_to_email' => null]);
            
        // Also remove the reference to the merchant entirely if desired, but request only mentioned nullifying email
        // "must be scrubbed to null 48 hours after they uninstall your app"
    }
}
