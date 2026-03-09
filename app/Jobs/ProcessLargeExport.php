<?php

namespace App\Jobs;

use App\Mail\Shopify\MasterpiecesExportLinkMail;
use App\Models\ImageGeneration;
use App\Services\MailService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

/**
 * Background job for large exports (> INLINE_IMAGE_THRESHOLD images).
 *
 * Flow:
 *   1.  Fetch ImageGeneration records for the given IDs.
 *   2.  Download image bytes and build a ZIP in storage/app/private/exports/.
 *   3.  Generate a 7-day signed download URL (route: export.download).
 *   4.  Send MasterpiecesExportLinkMail to the store owner.
 *   5.  Mark all exported generations as downloaded_at.
 *
 * The stored ZIP file is NOT deleted after the job — it persists until the
 * CleanupLargeExports scheduled task removes it (older than 8 days).
 */
class ProcessLargeExport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /** Maximum execution time (10 minutes — large galleries need time). */
    public int $timeout = 600;

    /** No auto-retries: a duplicate email on re-run would confuse the merchant. */
    public int $tries = 1;

    public function __construct(
        private string $shopDomain,
        private array  $generationIds,
        private string $exportType,
        private string $ownerEmail,
        private string $shopName,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────

    public function handle(): void
    {
        $generations = ImageGeneration::query()
            ->where('shop_domain', $this->shopDomain)
            ->where('status', 'completed')
            ->whereNotNull('result_image_url')
            ->whereIn('id', $this->generationIds)
            ->orderByDesc('updated_at')
            ->get(['id', 'tool_used', 'result_image_url']);

        if ($generations->isEmpty()) {
            Log::warning('ProcessLargeExport: no valid generations found', ['shop' => $this->shopDomain]);
            return;
        }

        // ── Build ZIP ────────────────────────────────────────────────────────
        $uuid       = (string) Str::uuid();
        $dateStamp  = now()->format('Ymd');
        $shortId    = substr(str_replace('-', '', $uuid), 0, 8);
        $zipFilename = "masterpieces-export-{$dateStamp}-{$shortId}.zip";

        // Private, non-web-accessible storage (storage/app/private/exports/)
        $exportRelPath = 'exports/' . $uuid . '.zip';
        $exportAbsPath = Storage::disk('local')->path($exportRelPath);

        $exportDir = dirname($exportAbsPath);
        if (! is_dir($exportDir)) {
            @mkdir($exportDir, 0755, true);
        }

        $zip = new \ZipArchive();
        if ($zip->open($exportAbsPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            Log::error('ProcessLargeExport: failed to create ZIP', [
                'shop' => $this->shopDomain,
                'path' => $exportAbsPath,
            ]);
            return;
        }

        $added = 0;
        foreach ($generations as $index => $generation) {
            $bytes = $this->fetchImageBytes((string) $generation->result_image_url);
            if ($bytes === null || $bytes === '') {
                continue;
            }

            $folder = '';
            if ($this->exportType === 'categories' || $this->exportType === 'specific_tool') {
                $raw    = strtolower((string) ($generation->tool_used ?: 'uncategorized'));
                $tool   = preg_replace('/[^a-z0-9_\-]+/i', '-', $raw) ?: 'uncategorized';
                $folder = $tool . '/';
            }

            $zip->addFromString($folder . 'masterpiece-' . ($index + 1) . '.png', $bytes);
            $added++;
        }

        $zip->close();

        if ($added === 0) {
            @unlink($exportAbsPath);
            Log::warning('ProcessLargeExport: no image bytes available', ['shop' => $this->shopDomain]);
            return;
        }

        // ── Generate signed download URL (valid 7 days) ──────────────────────
        $downloadUrl = URL::temporarySignedRoute(
            'export.download',
            now()->addDays(7),
            ['filename' => $uuid, 'dl' => $zipFilename],
        );

        // ── Send email with download link ────────────────────────────────────
        $exportLabel = match ($this->exportType) {
            'categories'    => 'Organised by tool',
            'specific_tool' => 'Specific tool set',
            default         => 'All in one folder',
        };

        $smtp = MailService::resolveSmtp();
        if (! $smtp) {
            Log::error('ProcessLargeExport: no SMTP configured', ['shop' => $this->shopDomain]);
            // Keep the ZIP — if SMTP is configured later the link was never sent, so the file can be cleaned up.
            return;
        }

        try {
            $sent = MailService::send(
                toAddress: $this->ownerEmail,
                mailable: new MasterpiecesExportLinkMail(
                    fromAddress: $smtp->from_address,
                    fromName:    $smtp->from_name,
                    shopName:    $this->shopName,
                    imagesCount: $added,
                    exportLabel: $exportLabel,
                    downloadUrl: $downloadUrl,
                    zipFilename: $zipFilename,
                    expiresAt:   now()->addDays(7)->format('M j, Y'),
                ),
                subject: 'Your masterpiece export is ready — ' . $this->shopName,
            );

            if ($sent) {
                ImageGeneration::query()
                    ->whereIn('id', $generations->pluck('id')->all())
                    ->whereNull('downloaded_at')
                    ->update(['downloaded_at' => now()]);
            } else {
                Log::warning('ProcessLargeExport: MailService::send returned false', [
                    'shop' => $this->shopDomain,
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('ProcessLargeExport: email send threw exception', [
                'shop'  => $this->shopDomain,
                'error' => $e->getMessage(),
            ]);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetch raw image bytes from a URL.
     * Handles both local storage paths and external URLs.
     */
    private function fetchImageBytes(string $url): ?string
    {
        $appUrl = rtrim(config('app.url'), '/');

        if (str_starts_with($url, $appUrl . '/') && str_contains($url, 'storage/')) {
            $path     = substr($url, strpos($url, 'storage/') + strlen('storage/'));
            $fullPath = Storage::disk('public')->path($path);
            if (is_file($fullPath)) {
                return file_get_contents($fullPath) ?: null;
            }
        }

        try {
            $response = Http::timeout(30)->get($url);
            return $response->successful() ? $response->body() : null;
        } catch (\Throwable $e) {
            Log::warning('ProcessLargeExport: could not fetch image', [
                'url'   => $url,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
