<?php

namespace App\Services;

use App\Models\AppStat;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * AiUniversalService — Universal product photography via Nano Banana 2 on Replicate.
 *
 * Uses the SAME Replicate API key (config('services.replicate.token')) as every
 * other tool in the app — no separate key is needed.
 *
 * Target model: google/nano-banana-2 (same model already powering Magic Eraser)
 * Model version: 71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd
 *
 * Nano Banana 2 is natively multimodal — it accepts an array of images in a single
 * `image_input` field.  We place the product image first, then append any uploaded
 * reference images (style, face, pose).  The engineered prompt tells the model the
 * role of each image and mandates strict product preservation.
 */
class AiUniversalService
{
    private const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

    /** Same model version as Magic Eraser — confirmed working in this app. */
    private const NANO_BANANA_2_VERSION = 'google/nano-banana-2:71516450bdbeafc41df33ad538bc8cc6a90f80038a563b1260531c02d694f4fd';

    /* ──────────────────────────────────────────────────────────────
       generateNanoBanana — compose multimodal payload & dispatch
    ────────────────────────────────────────────────────────────── */
    public function generateNanoBanana(Request $request, string $shopDomain, int $creditsUsed = 2): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Replicate API key is not configured.');
        }

        // Resolve the main product image
        $productUrl = $this->resolveImageUrl($request, 'main_image');
        if (! $productUrl) {
            throw new \InvalidArgumentException('Invalid product image: provide a file upload or URL.');
        }

        $userPrompt = (string) $request->input('prompt', '');
        $intent     = $request->input('intent', 'environment');

        // Collect uploaded reference images (style_ref, face_ref, pose_ref)
        $refUrls  = [];
        $refRoles = [];
        foreach (['style_ref', 'face_ref', 'pose_ref'] as $refKey) {
            if ($request->hasFile("reference_images.{$refKey}")) {
                $url        = $this->storeUploadedFile($request->file("reference_images.{$refKey}"));
                $refUrls[]  = $url;
                $refRoles[] = str_replace('_ref', '', $refKey); // 'style', 'face', 'pose'
            }
        }
        $hasRefs = count($refUrls) > 0;

        // Build the engineered prompt
        $engineeredPrompt = $this->buildPrompt($userPrompt, $intent, $hasRefs, $refRoles);

        // Create ImageGeneration record
        $generation = ImageGeneration::create([
            'shop_domain'        => $shopDomain,
            'tool_used'          => 'universal_generate',
            'status'             => 'processing',
            'credits_used'       => $creditsUsed,
            'original_image_url' => $productUrl,
        ]);

        AppStat::incrementKey('total_api_requests');

        try {
            // Build the image_input array: product image first, then refs in order
            // Convert local storage URLs to base64 so Replicate can read them.
            $imageInput = [$this->imageUrlToReplicateInput($productUrl)];
            foreach ($refUrls as $refUrl) {
                $imageInput[] = $this->imageUrlToReplicateInput($refUrl);
            }

            // Nano Banana 2 Replicate payload — identical structure to Magic Eraser
            $aspectRatio = $request->input('aspect_ratio', '1:1');
            $resolution  = strtoupper($request->input('resolution', '1K'));

            $payload = [
                'version' => self::NANO_BANANA_2_VERSION,
                'input'   => [
                    'prompt'        => $engineeredPrompt,
                    'image_input'   => $imageInput,
                    'aspect_ratio'  => $aspectRatio,
                    'resolution'    => $resolution,
                    'output_format' => 'jpg',
                ],
            ];

            Log::info('AiUniversal: dispatching Nano Banana 2', [
                'shop'         => $shopDomain,
                'intent'       => $intent,
                'aspect_ratio' => $aspectRatio,
                'resolution'   => $resolution,
                'has_refs'     => $hasRefs,
                'ref_count'    => count($refUrls),
                'credits_used' => $creditsUsed,
            ]);

            $response = Http::withToken($token)
                ->withHeaders(['Prefer' => 'wait=60'])
                ->timeout(65)
                ->post(self::REPLICATE_API, $payload);

            if ($response->failed()) {
                $errorDetail = $response->json('detail') ?? $response->body();
                $errorMsg    = 'Nano Banana 2 API error: ' . (is_string($errorDetail) && $errorDetail !== '' ? $errorDetail : ('HTTP ' . $response->status()));
                Log::error('Nano Banana 2 API error', ['status' => $response->status(), 'body' => $response->body()]);
                $generation->update(['status' => 'failed', 'error_message' => $errorMsg]);
                AppStat::incrementKey('universal_generate_failed_count');
                throw new \RuntimeException($errorMsg);
            }

            $data   = $response->json();
            $jobId  = $data['id'] ?? null;
            $status = $data['status'] ?? '';

            if (! $jobId) {
                $generation->update(['status' => 'failed', 'error_message' => 'Replicate did not return a job ID.']);
                AppStat::incrementKey('universal_generate_failed_count');
                throw new \RuntimeException('Replicate did not return a job ID.');
            }

            $generation->update(['api_job_id' => $jobId]);

            // Handle synchronous completion (Prefer: wait=60 may resolve immediately)
            if (in_array($status, ['succeeded', 'successful'], true)) {
                $outputUrl = $data['output'] ?? null;
                $outputUrl = $this->extractOutput($outputUrl);
                if ($outputUrl) {
                    $stored    = $this->downloadAndStore($outputUrl, $token, 'universal');
                    $outputUrl = $stored ?? $outputUrl;
                    $generation->update(['status' => 'completed', 'result_image_url' => $outputUrl]);
                    AppStat::incrementKey('universal_generate_success_count');
                    return [
                        'status'           => 'done',
                        'result_image_url' => $outputUrl,
                        'generation_id'    => $generation->id,
                    ];
                }
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error    = $data['error'] ?? 'Nano Banana 2 job failed.';
                $errorMsg = is_string($error) ? $error : 'Nano Banana 2 job failed.';
                $generation->update(['status' => 'failed', 'error_message' => $errorMsg]);
                AppStat::incrementKey('universal_generate_failed_count');
                throw new \RuntimeException($errorMsg);
            }

            // Still queued / processing — caller will poll
            return [
                'status'        => 'processing',
                'job_id'        => $jobId,
                'generation_id' => $generation->id,
            ];

        } catch (\Throwable $e) {
            // Catch any unexpected exception after the generation record was created
            // (e.g. base64 conversion failure, HTTP connection error, etc.)
            // Only mark failed if still in processing state (specific paths above already set it)
            if ($generation->status === 'processing') {
                $generation->update([
                    'status'        => 'failed',
                    'error_message' => $e->getMessage() ?: 'Unexpected error during generation.',
                ]);
                AppStat::incrementKey('universal_generate_failed_count');
            }
            throw $e;
        }
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
            ->where('tool_used', 'universal_generate')
            ->first();

        if ($status === 'succeeded') {
            $outputUrl = $this->extractOutput($data['output'] ?? null);
            if ($outputUrl) {
                $stored    = $this->downloadAndStore($outputUrl, $token, 'universal');
                $outputUrl = $stored ?? $outputUrl;
            }
            if ($generation) {
                $generation->update(['status' => 'completed', 'result_image_url' => $outputUrl]);
                AppStat::incrementKey('universal_generate_success_count');
            }
            return [
                'status'           => 'done',
                'result_image_url' => $outputUrl,
                'generation_id'    => $generation?->id,
            ];
        }

        if (in_array($status, ['failed', 'canceled'], true)) {
            $error = $data['error'] ?? 'Nano Banana 2 job failed.';
            $generation?->update([
                'status'        => 'failed',
                'error_message' => is_string($error) ? $error : json_encode($error),
            ]);
            AppStat::incrementKey('universal_generate_failed_count');
            return ['status' => 'error', 'message' => is_string($error) ? $error : 'Job failed.'];
        }

        return ['status' => 'processing'];
    }

    /* ──────────────────────────────────────────────────────────────
       Prompt Engineering
    ────────────────────────────────────────────────────────────── */

    /**
     * Build the full engineered prompt:
     *   1. Hardcoded system preservation rules (product must be unchanged)
     *   2. Intent-specific action instruction
     *   3. User scene description
     *   4. If reference images are present, enumerate their roles and add
     *      the mandatory style-matching instruction.
     */
    private function buildPrompt(string $userPrompt, string $intent, bool $hasRefs, array $refRoles = []): string
    {
        $systemPrompt = 'You are an elite product photography AI. '
            . 'Preserve the EXACT pixels, logos, text, and structural integrity of the main product image (first image). '
            . 'Do not alter the product\'s shape, colour, or any text/logo printed on it.';

        $intentHint = match ($intent) {
            'on_human'    => 'Place the product naturally on or held by a human model in the described scene.',
            'environment' => 'Compose the product as the hero element within the described environment.',
            default       => '',
        };

        $parts = array_filter([$systemPrompt, $intentHint, $userPrompt]);
        $prompt = implode("\n\n", $parts);

        if ($hasRefs && ! empty($refRoles)) {
            // Tell the model which subsequent images serve which purpose
            $roleMap = [];
            foreach ($refRoles as $i => $role) {
                $roleMap[] = 'Image ' . ($i + 2) . ' = ' . $role . ' reference';
            }
            $prompt .= "\n\nReference images provided: " . implode(', ', $roleMap) . '.';
            $prompt .= "\nMandatory Style Instruction: Strictly match the lighting, mood, and colour palette "
                . 'of the style reference. Adapt pose and composition from any face or pose references '
                . 'while keeping the product (image 1) completely unchanged.';
        }

        return $prompt;
    }

    /* ──────────────────────────────────────────────────────────────
       Helpers
    ────────────────────────────────────────────────────────────── */

    /** Normalise a Replicate output to a single URL string, or null if absent. */
    private function extractOutput(mixed $output): ?string
    {
        if (is_string($output) && filter_var($output, FILTER_VALIDATE_URL)) {
            return $output;
        }
        if (is_array($output)) {
            foreach ($output as $item) {
                if (is_string($item) && filter_var($item, FILTER_VALIDATE_URL)) {
                    return $item;
                }
            }
        }
        return null;
    }

    /**
     * If $url is one of our own app storage URLs on localhost (where Replicate
     * cannot reach), convert to base64 data URI.  For all other hosts (ngrok,
     * staging, production) the file is publicly accessible, so we return the
     * URL as-is to avoid bloating the Replicate request payload — especially
     * when multiple reference images are included.
     */
    private function imageUrlToReplicateInput(string $url): string
    {
        $appUrl = rtrim(config('app.url'), '/');
        if ($appUrl === '' || ! str_starts_with($url, $appUrl . '/')) {
            return $url;
        }

        // Only base64-encode when running on localhost/127.0.0.1 (unreachable by Replicate).
        // Publicly accessible hosts (ngrok, production) can serve the URL directly.
        $host = strtolower(parse_url($appUrl, PHP_URL_HOST) ?? '');
        if ($host !== 'localhost' && $host !== '127.0.0.1') {
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
