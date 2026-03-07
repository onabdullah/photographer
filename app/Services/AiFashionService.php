<?php

namespace App\Services;

use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * AiFashionService — Virtual Try-On for apparel via IDM-VTON on Replicate.
 *
 * Uses the SAME Replicate API key (config('services.replicate.token')) as every
 * other tool in the app — no separate key is needed.
 *
 * Target model: cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985
 *
 * Replicate payload:
 *   input.human_img   – URL or Base64 of the model/person
 *   input.garm_img    – URL or Base64 of the garment
 *   input.category    – "upper_body" | "lower_body" | "dress"
 *   input.crop        – true
 */
class AiFashionService
{
    private const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

    /** IDM-VTON model version on Replicate (Kolors VTON is the alternative). */
    private const VTON_MODEL_VERSION = 'cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985';

    /* ──────────────────────────────────────────────────────────────
       generateVton — dispatch VTON job to Replicate
    ────────────────────────────────────────────────────────────── */
    public function generateVton(Request $request, string $shopDomain): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Replicate API key is not configured.');
        }

        // Resolve and store garment image (main_image)
        $garmentUrl = $this->resolveImageUrl($request, 'main_image');
        if (! $garmentUrl) {
            throw new \InvalidArgumentException('Invalid garment image: provide a file upload or URL.');
        }

        // Resolve model/human image (file upload takes priority; otherwise use preset URL)
        $humanUrl = null;
        if ($request->hasFile('human_image')) {
            $humanUrl = $this->storeUploadedFile($request->file('human_image'));
        } elseif ($request->filled('human_image_url')) {
            $humanUrl = $request->input('human_image_url');
        }
        if (! $humanUrl) {
            throw new \InvalidArgumentException('Invalid model image: provide a custom upload or select a preset.');
        }

        $category = $request->input('garment_category', 'upper_body');

        // Create ImageGeneration record (Replicate job ID filled in after API response)
        $generation = ImageGeneration::create([
            'shop_domain'        => $shopDomain,
            'tool_used'          => 'fashion_vton',
            'status'             => 'processing',
            'credits_used'       => 2,
            'original_image_url' => $garmentUrl,
        ]);

        // Convert any local storage URLs to base64 data URIs so Replicate can read them
        // from ngrok / localhost without a 403.
        $humanInput   = $this->imageUrlToReplicateInput($humanUrl);
        $garmentInput = $this->imageUrlToReplicateInput($garmentUrl);

        $payload = [
            'version' => self::VTON_MODEL_VERSION,
            'input'   => [
                'human_img'   => $humanInput,
                'garm_img'    => $garmentInput,
                'garment_des' => "A {$category} garment",
                'category'    => $category,
                'crop'        => true,
                'seed'        => 42,
            ],
        ];

        $response = Http::withToken($token)
            ->withHeaders(['Prefer' => 'wait=60'])
            ->timeout(65)
            ->post(self::REPLICATE_API, $payload);

        if ($response->failed()) {
            Log::error('IDM-VTON API error', ['status' => $response->status(), 'body' => $response->body()]);
            $generation->update(['status' => 'failed']);
            throw new \RuntimeException('IDM-VTON API error: ' . ($response->json('detail') ?? $response->body()));
        }

        $data   = $response->json();
        $jobId  = $data['id'] ?? null;
        $status = $data['status'] ?? '';

        if (! $jobId) {
            $generation->update(['status' => 'failed']);
            throw new \RuntimeException('Replicate did not return a job ID.');
        }

        $generation->update(['api_job_id' => $jobId]);

        // Handle synchronous completion (Prefer: wait= may resolve immediately)
        if (in_array($status, ['succeeded', 'successful'], true)) {
            $outputUrl = $data['output'] ?? null;
            if (is_array($outputUrl)) {
                $outputUrl = $outputUrl[0] ?? null;
            }
            if ($outputUrl) {
                $stored = $this->downloadAndStore($outputUrl, $token, 'fashion_vton');
                $outputUrl = $stored ?? $outputUrl;
                $generation->update(['status' => 'completed', 'result_image_url' => $outputUrl]);
                return [
                    'status'           => 'done',
                    'result_image_url' => $outputUrl,
                    'generation_id'    => $generation->id,
                ];
            }
        }

        if (in_array($status, ['failed', 'canceled'], true)) {
            $error = $data['error'] ?? 'IDM-VTON job failed.';
            $generation->update(['status' => 'failed']);
            throw new \RuntimeException(is_string($error) ? $error : 'IDM-VTON job failed.');
        }

        // Still queued / processing — caller will poll
        return [
            'status'        => 'processing',
            'job_id'        => $jobId,
            'generation_id' => $generation->id,
        ];
    }

    /* ──────────────────────────────────────────────────────────────
       checkJobStatus — poll Replicate prediction status
    ────────────────────────────────────────────────────────────── */
    public function checkJobStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Replicate API key is not configured.');
        }

        $response = Http::withToken($token)
            ->timeout(25)
            ->get(self::REPLICATE_API . '/' . $jobId);

        if ($response->failed()) {
            throw new \RuntimeException('Failed to poll Replicate: ' . $response->body());
        }

        $data   = $response->json();
        $status = $data['status'] ?? 'unknown';

        $generation = ImageGeneration::where('api_job_id', $jobId)
            ->where('tool_used', 'fashion_vton')
            ->first();

        if ($status === 'succeeded') {
            $outputUrl = $data['output'] ?? null;
            if (is_array($outputUrl)) {
                $outputUrl = $outputUrl[0] ?? null;
            }
            if ($outputUrl) {
                $stored = $this->downloadAndStore($outputUrl, $token, 'fashion_vton');
                $outputUrl = $stored ?? $outputUrl;
            }
            if ($generation) {
                $generation->update(['status' => 'completed', 'result_image_url' => $outputUrl]);
            }
            return [
                'status'           => 'done',
                'result_image_url' => $outputUrl,
                'generation_id'    => $generation?->id,
            ];
        }

        if (in_array($status, ['failed', 'canceled'], true)) {
            $error = $data['error'] ?? 'IDM-VTON job failed.';
            $generation?->update([
                'status'        => 'failed',
                'error_message' => is_string($error) ? $error : json_encode($error),
            ]);
            return ['status' => 'error', 'message' => is_string($error) ? $error : 'Job failed.'];
        }

        return ['status' => 'processing'];
    }

    /* ──────────────────────────────────────────────────────────────
       Helpers
    ────────────────────────────────────────────────────────────── */

    /**
     * If $url is one of our own app storage URLs, convert to base64 data URI
     * so Replicate can read it even from localhost / ngrok.
     */
    private function imageUrlToReplicateInput(string $url): string
    {
        $appUrl = rtrim(config('app.url'), '/');
        if ($appUrl === '' || ! str_starts_with($url, $appUrl . '/')) {
            return $url;
        }
        $path = parse_url($url, PHP_URL_PATH);
        if (! $path || ! str_starts_with($path, '/storage/')) {
            return $url;
        }
        $storagePath = substr($path, strlen('/storage/'));
        if (! Storage::disk('public')->exists($storagePath)) {
            return $url;
        }
        $contents = Storage::disk('public')->get($storagePath);
        if (! $contents) {
            return $url;
        }
        $mime = Storage::disk('public')->mimeType($storagePath) ?: 'image/png';
        return 'data:' . $mime . ';base64,' . base64_encode($contents);
    }

    /**
     * Download a Replicate output image and store it on our public disk so the
     * URL persists after Replicate's CDN TTL expires.
     */
    private function downloadAndStore(string $url, string $token, string $prefix): ?string
    {
        try {
            $response = Http::timeout(60)->get($url);
            if (! $response->successful()) {
                // Retry with auth token (some Replicate output URLs require it)
                $response = Http::withToken($token)->timeout(60)->get($url);
                if (! $response->successful()) {
                    return null;
                }
            }
            $path = 'ai-studio/' . $prefix . '_' . Str::random(16) . '_' . time() . '.png';
            Storage::disk('public')->put($path, $response->body());
            $stored = Storage::disk('public')->url($path);
            if (str_starts_with($stored, '/')) {
                $stored = rtrim(config('app.url'), '/') . $stored;
            }
            return $stored;
        } catch (\Throwable) {
            return null;
        }
    }

    private function resolveImageUrl(Request $request, string $field): ?string
    {
        if ($request->hasFile($field)) {
            return $this->storeUploadedFile($request->file($field));
        }
        if ($request->filled($field . '_url')) {
            return $request->input($field . '_url');
        }
        return null;
    }

    private function storeUploadedFile(\Illuminate\Http\UploadedFile $file): string
    {
        $path = 'ai-studio/uploads/' . Str::random(16) . '_' . $file->getClientOriginalName();
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
        $url = Storage::disk('public')->url($path);
        if (str_starts_with($url, '/')) {
            $url = rtrim(config('app.url'), '/') . $url;
        }
        return $url;
    }
}
