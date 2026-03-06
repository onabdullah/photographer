<?php

namespace App\Services;

use App\Contracts\BackgroundRemoverInterface;
use App\Models\AppStat;
use App\Models\ImageGeneration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Centralized service for AI image generation (background removal, upscaling).
 * Handles Replicate API calls, ImageGeneration records, and AppStat increments.
 * Used by AiStudioController and ImageUpscalerController; reusable for Livewire.
 */
class AiGenerationService
{
    private const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

    /** nightmareai/real-esrgan – image, scale (2–10), face_enhance */
    private const UPSCALER_MODEL_VERSION = 'nightmareai/real-esrgan:279a18ae4f30c9d3636516918d76c8c8262a9bc7c415fe90a88087c78c9ebbef';

    /** LaMa inpainting: image + mask (white = erase, black = keep). twn39/lama returns output URL; allenhooo/lama often returns output null. */
    private const LAMA_MODEL_VERSION = 'twn39/lama:2b91ca2340801c2a5be745612356fac36a17f698354a07f48a62d564d3b3a7a0';

    /** tencentarc/gfpgan – face/quality enhancement: img, version (v1.4, v1.3, RestoreFormer), scale (1 or 2). */
    private const ENHANCER_MODEL_VERSION = 'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c';

    /** zsxkib/ic-light – AI relighting: subject_image, prompt. Latest version. */
    private const IC_LIGHT_MODEL_VERSION = 'zsxkib/ic-light:d41bcb10d8c159868f4cfbd7c6a2ca01484f7d39e4613419d5952c61562f1ba7';

    public function __construct(
        private BackgroundRemoverInterface $backgroundRemover
    ) {}

    /**
     * Resolve image URL from request: upload file to storage or use provided URL.
     * Returns full public URL or null if invalid.
     */
    public function resolveImageUrlFromRequest(\Illuminate\Http\Request $request): ?string
    {
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = 'ai-studio/uploads/' . Str::random(16) . '_' . $file->getClientOriginalName();
            Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
            $url = Storage::disk('public')->url($path);
            if (str_starts_with($url, '/')) {
                $url = rtrim(config('app.url'), '/') . $url;
            }
            return $url;
        }
        if ($request->filled('image') && filter_var($request->input('image'), FILTER_VALIDATE_URL)) {
            return $request->input('image');
        }
        return null;
    }

    /**
     * Convert app storage URL to Replicate input: use base64 data URI when URL is our app (avoids ngrok 403).
     */
    public function imageUrlToReplicateInput(string $imageUrl): string
    {
        $appUrl = rtrim(config('app.url'), '/');
        if ($appUrl === '' || ! str_starts_with($imageUrl, $appUrl . '/')) {
            return $imageUrl;
        }
        $path = parse_url($imageUrl, PHP_URL_PATH);
        if (! $path || ! str_starts_with($path, '/storage/')) {
            return $imageUrl;
        }
        $storagePath = substr($path, strlen('/storage/'));
        if (! Storage::disk('public')->exists($storagePath)) {
            return $imageUrl;
        }
        $contents = Storage::disk('public')->get($storagePath);
        if ($contents === null || $contents === '') {
            return $imageUrl;
        }
        $mime = Storage::disk('public')->mimeType($storagePath) ?: 'image/png';

        return 'data:' . $mime . ';base64,' . base64_encode($contents);
    }

    /**
     * Download image from URL and store on public disk. Returns full public URL or null.
     */
    public function storeProcessedImageFromUrl(string $url, string $filenamePrefix = 'result'): ?string
    {
        try {
            $response = Http::timeout(60)->get($url);
            if (! $response->successful()) {
                return null;
            }
            $path = 'ai-studio/' . $filenamePrefix . '_' . Str::random(16) . '_' . time() . '.png';
            Storage::disk('public')->put($path, $response->body());
            $resultUrl = Storage::disk('public')->url($path);
            if (str_starts_with($resultUrl, '/')) {
                $resultUrl = rtrim(config('app.url'), '/') . $resultUrl;
            }
            return $resultUrl;
        } catch (\Throwable $e) {
            Log::channel('upscaler')->warning('storeProcessedImageFromUrl failed', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Download from URL (e.g. Replicate delivery), optionally with Bearer token. Stores on public disk.
     * Tries plain GET first, then GET with token if URL looks like Replicate and first attempt failed.
     */
    private function storeProcessedImageFromUrlWithToken(string $url, string $token, string $filenamePrefix = 'result'): ?string
    {
        $stored = $this->storeProcessedImageFromUrl($url, $filenamePrefix);
        if ($stored !== null) {
            return $stored;
        }
        if (! str_contains(strtolower($url), 'replicate')) {
            return null;
        }
        try {
            $response = Http::withToken($token)->timeout(60)->get($url);
            if (! $response->successful()) {
                return null;
            }
            $path = 'ai-studio/' . $filenamePrefix . '_' . Str::random(16) . '_' . time() . '.png';
            Storage::disk('public')->put($path, $response->body());
            $resultUrl = Storage::disk('public')->url($path);
            if (str_starts_with($resultUrl, '/')) {
                $resultUrl = rtrim(config('app.url'), '/') . $resultUrl;
            }
            return $resultUrl;
        } catch (\Throwable $e) {
            Log::channel('upscaler')->warning('storeProcessedImageFromUrlWithToken failed', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * When prediction output is null but urls.stream has a file ID, try to download via API.
     * Tries: (1) stream URL GET, (2) api.replicate.com/v1/files/{file_id}/download with Bearer.
     */
    private function fetchAndStoreFromReplicateStreamUrl(string $streamUrl, string $token, string $filenamePrefix = 'result'): ?string
    {
        if (! str_contains($streamUrl, 'stream.replicate.com/v1/files/')) {
            return null;
        }
        $fileId = substr($streamUrl, strpos($streamUrl, '/v1/files/') + 9);
        $fileId = trim($fileId, "/ \t\n\r");

        $urlsToTry = [
            $streamUrl,
            'https://api.replicate.com/v1/files/' . $fileId . '/download',
        ];

        foreach ($urlsToTry as $url) {
            try {
                $response = Http::withToken($token)->timeout(30)->get($url);
                if (! $response->successful()) {
                    if ($url === $streamUrl) {
                        Log::channel('magic_eraser')->warning('Replicate stream URL fetch failed', ['status' => $response->status(), 'url' => $url]);
                    }
                    continue;
                }
                $body = $response->body();
                if (strlen($body) < 100) {
                    continue;
                }
                $contentType = $response->header('Content-Type') ?? '';
                $isPng = str_starts_with($body, "\x89PNG\r\n\x1a\n");
                if (! $isPng && ! str_contains($contentType, 'image/')) {
                    continue;
                }
                $path = 'ai-studio/' . $filenamePrefix . '_' . Str::random(16) . '_' . time() . '.png';
                Storage::disk('public')->put($path, $body);
                $resultUrl = Storage::disk('public')->url($path);
                if (str_starts_with($resultUrl, '/')) {
                    $resultUrl = rtrim(config('app.url'), '/') . $resultUrl;
                }
                return $resultUrl;
            } catch (\Throwable $e) {
                Log::channel('magic_eraser')->warning('Replicate file fetch failed', ['url' => $url, 'error' => $e->getMessage()]);
            }
        }
        return null;
    }

    /**
     * Decode base64 mask (e.g. from frontend canvas) and store on public disk.
     * Strips data URL prefix if present. Returns full public URL or null.
     */
    public function storeBase64MaskAsUrl(string $maskBase64): ?string
    {
        $data = $maskBase64;
        if (str_starts_with($data, 'data:')) {
            $comma = strpos($data, ',');
            $data = $comma !== false ? substr($data, $comma + 1) : '';
        }
        $decoded = base64_decode($data, true);
        if ($decoded === false || strlen($decoded) === 0) {
            return null;
        }
        $path = 'ai-studio/masks/mask_' . Str::random(16) . '_' . time() . '.png';
        Storage::disk('public')->put($path, $decoded);
        $url = Storage::disk('public')->url($path);
        if (str_starts_with($url, '/')) {
            $url = rtrim(config('app.url'), '/') . $url;
        }
        return $url;
    }

    /**
     * Start a generation job (remove_bg, upscaler, or magic_eraser).
     * Creates ImageGeneration (processing), increments total_api_requests.
     * Returns: ['status' => 'processing'|'completed', 'job_id' => ?string, 'result_url' => ?string, 'generation_id' => int]
     *
     * @param  array{image_url: string, scale?: int, face_enhance?: bool, mask_base64?: string}  $payload
     */
    public function startGeneration(string $toolUsed, array $payload, ?string $shopDomain): array
    {
        $imageUrl = $payload['image_url'] ?? null;
        if (! $imageUrl || ! $shopDomain) {
            throw new \InvalidArgumentException('Missing image_url or shop domain.');
        }

        AppStat::incrementKey('total_api_requests');

        if ($toolUsed === 'remove_bg') {
            return $this->startBackgroundRemoval($imageUrl, $shopDomain);
        }
        if ($toolUsed === 'upscaler') {
            return $this->startUpscaler($payload, $shopDomain);
        }
        if ($toolUsed === 'magic_eraser') {
            return $this->startMagicEraser($payload, $shopDomain);
        }
        if ($toolUsed === 'enhance') {
            return $this->startEnhanceJob($payload, $shopDomain);
        }
        if ($toolUsed === 'lighting') {
            return $this->startLightingJob(
                $payload['image_url'] ?? null,
                $payload['prompt'] ?? '',
                $shopDomain
            );
        }

        throw new \InvalidArgumentException("Unknown tool: {$toolUsed}");
    }

    /**
     * Check job status. On success: update ImageGeneration, increment success stat.
     * Returns: ['status' => 'processing'|'completed'|'error', 'job_id' => string, 'result_url' => ?string, 'generation_id' => ?int] or ['status' => 'error', 'message' => string]
     */
    public function checkStatus(string $jobId, string $toolUsed): array
    {
        if ($toolUsed === 'remove_bg') {
            return $this->checkBackgroundRemovalStatus($jobId);
        }
        if ($toolUsed === 'upscaler') {
            return $this->checkUpscalerStatus($jobId);
        }
        if ($toolUsed === 'magic_eraser') {
            return $this->checkMagicEraserStatus($jobId);
        }
        if ($toolUsed === 'enhance') {
            return $this->checkEnhanceStatus($jobId);
        }
        if ($toolUsed === 'lighting') {
            return $this->checkLightingStatus($jobId);
        }

        throw new \InvalidArgumentException("Unknown tool: {$toolUsed}");
    }

    private function startBackgroundRemoval(string $imageUrl, string $shopDomain): array
    {
        $generation = ImageGeneration::create([
            'shop_domain' => $shopDomain,
            'tool_used' => 'background_remover',
            'api_job_id' => null,
            'original_image_url' => $imageUrl,
            'result_image_url' => null,
            'shopify_product_id' => null,
            'status' => 'processing',
            'error_message' => null,
            'processing_time_seconds' => null,
        ]);

        try {
            $result = $this->backgroundRemover->processImage($imageUrl);

            if (($result['job_id'] ?? null) !== null) {
                $generation->update(['api_job_id' => $result['job_id']]);
            }

            if (($result['status'] ?? '') === 'completed' && ! empty($result['result_url'] ?? null)) {
                $generation->update([
                    'result_image_url' => $result['result_url'],
                    'status' => 'completed',
                ]);
                AppStat::incrementKey('bg_remover_success_count');
            }

            return [
                'status' => $result['status'],
                'job_id' => $result['job_id'] ?? null,
                'result_url' => $result['result_url'] ?? null,
                'generation_id' => $generation->id,
            ];
        } catch (\Exception $e) {
            $generation->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
            AppStat::incrementKey('bg_remover_failed_count');
            throw $e;
        }
    }

    private function startUpscaler(array $payload, string $shopDomain): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Upscaler is not configured.');
        }

        $imageUrl = $payload['image_url'];
        $scale = (int) ($payload['scale'] ?? 4);
        $faceEnhance = (bool) ($payload['face_enhance'] ?? false);
        $imageInput = $this->imageUrlToReplicateInput($imageUrl);

        $apiPayload = [
            'version' => self::UPSCALER_MODEL_VERSION,
            'input' => [
                'image' => $imageInput,
                'scale' => $scale,
                'face_enhance' => $faceEnhance,
            ],
        ];

        Log::channel('upscaler')->info('Upscaler create prediction', [
            'shop_domain' => $shopDomain,
            'scale' => $scale,
            'face_enhance' => $faceEnhance,
        ]);

        $response = Http::withToken($token)
            ->timeout(30)
            ->post(self::REPLICATE_API, $apiPayload);

        $statusCode = $response->status();
        $body = $response->json() ?? [];

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            Log::channel('upscaler')->warning('Upscaler create failed', ['status' => $statusCode, 'detail' => $detail]);
            throw new \RuntimeException(is_string($detail) ? $detail : 'Upscale request failed. Please try again.');
        }

        $predictionId = $body['id'] ?? null;
        if (empty($predictionId)) {
            throw new \RuntimeException('Upscaler did not return a job ID.');
        }

        $generation = ImageGeneration::create([
            'shop_domain' => $shopDomain,
            'tool_used' => 'upscaler',
            'api_job_id' => $predictionId,
            'original_image_url' => $imageUrl,
            'result_image_url' => null,
            'shopify_product_id' => null,
            'status' => 'processing',
            'error_message' => null,
            'processing_time_seconds' => null,
        ]);

        return [
            'status' => 'processing',
            'job_id' => $predictionId,
            'generation_id' => $generation->id,
        ];
    }

    private function startMagicEraser(array $payload, string $shopDomain): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Magic eraser is not configured.');
        }

        $imageUrl = $payload['image_url'] ?? null;
        $maskBase64 = $payload['mask_base64'] ?? null;
        if (! $imageUrl || ! $maskBase64) {
            throw new \InvalidArgumentException('Missing image_url or mask_base64 for magic eraser.');
        }

        $maskUrl = $this->storeBase64MaskAsUrl($maskBase64);
        if (! $maskUrl) {
            throw new \RuntimeException('Invalid mask data. Please draw the area to erase and try again.');
        }

        $imageInput = $this->imageUrlToReplicateInput($imageUrl);
        $maskInput = $this->imageUrlToReplicateInput($maskUrl);

        $apiPayload = [
            'version' => self::LAMA_MODEL_VERSION,
            'input' => [
                'image' => $imageInput,
                'mask' => $maskInput,
            ],
        ];

        Log::channel('magic_eraser')->info('Magic eraser create prediction', [
            'shop_domain' => $shopDomain,
        ]);

        $response = Http::withToken($token)
            ->withHeaders(['Prefer' => 'wait=60'])
            ->timeout(70)
            ->post(self::REPLICATE_API, $apiPayload);

        $statusCode = $response->status();
        $body = $response->json() ?? [];

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            Log::channel('magic_eraser')->warning('Magic eraser create failed', ['status' => $statusCode, 'detail' => $detail]);
            throw new \RuntimeException(is_string($detail) ? $detail : 'Magic eraser request failed. Please try again.');
        }

        $predictionId = $body['id'] ?? null;
        if (empty($predictionId)) {
            throw new \RuntimeException('Magic eraser did not return a job ID.');
        }

        $replicateStatus = $body['status'] ?? '';
        $output = $body['output'] ?? null;
        $resultUrl = $this->extractResultUrlFromReplicateOutput($output);
        if ($resultUrl === null) {
            $resultUrl = $this->extractFirstUrlFromArray($body);
        }

        $generation = ImageGeneration::create([
            'shop_domain' => $shopDomain,
            'tool_used' => 'magic_eraser',
            'api_job_id' => $predictionId,
            'original_image_url' => $imageUrl,
            'result_image_url' => null,
            'shopify_product_id' => null,
            'status' => 'processing',
            'error_message' => null,
            'processing_time_seconds' => null,
        ]);

        if (in_array($replicateStatus, ['succeeded', 'successful'], true) && $resultUrl) {
            $storedUrl = $this->storeProcessedImageFromUrl($resultUrl, 'magic_eraser');
            if ($storedUrl) {
                $resultUrl = $storedUrl;
            }
            $generation->update([
                'result_image_url' => $resultUrl,
                'status' => 'completed',
            ]);
            AppStat::incrementKey('magic_eraser_success_count');
            Log::channel('magic_eraser')->info('Magic eraser completed in sync response', ['job_id' => $predictionId]);
            return [
                'status' => 'completed',
                'job_id' => $predictionId,
                'result_url' => $resultUrl,
                'generation_id' => $generation->id,
            ];
        }

        if (in_array($replicateStatus, ['succeeded', 'successful'], true) && ! $resultUrl) {
            $streamUrl = $body['urls']['stream'] ?? null;
            if ($streamUrl && is_string($streamUrl)) {
                $resultUrl = $this->fetchAndStoreFromReplicateStreamUrl($streamUrl, $token, 'magic_eraser');
                if ($resultUrl) {
                    $generation->update([
                        'result_image_url' => $resultUrl,
                        'status' => 'completed',
                    ]);
                    AppStat::incrementKey('magic_eraser_success_count');
                    Log::channel('magic_eraser')->info('Magic eraser completed via stream URL (sync)', ['job_id' => $predictionId]);
                    return [
                        'status' => 'completed',
                        'job_id' => $predictionId,
                        'result_url' => $resultUrl,
                        'generation_id' => $generation->id,
                    ];
                }
            }
            $safe = $body;
            unset($safe['input'], $safe['logs']);
            $sample = json_encode($safe);
            if (strlen($sample) > 1500) {
                $sample = substr($sample, 0, 1500) . '...';
            }
            Log::channel('magic_eraser')->warning('Magic eraser sync succeeded but no URL', ['job_id' => $predictionId, 'output_raw' => $output, 'response_sample' => $sample]);
        }

        if (in_array($replicateStatus, ['failed', 'canceled'], true)) {
            $error = $body['error'] ?? $body['logs'] ?? 'Job failed.';
            $generation->update(['status' => 'failed', 'error_message' => is_string($error) ? $error : json_encode($error)]);
            AppStat::incrementKey('magic_eraser_failed_count');
            throw new \RuntimeException(is_string($error) ? $error : 'Magic eraser job failed.');
        }

        return [
            'status' => 'processing',
            'job_id' => $predictionId,
            'generation_id' => $generation->id,
        ];
    }

    private function startEnhanceJob(array $payload, string $shopDomain): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Image enhancer is not configured.');
        }

        $imageUrl = $payload['image_url'] ?? null;
        if (! $imageUrl) {
            throw new \InvalidArgumentException('Missing image_url for enhance.');
        }

        $version = $payload['version'] ?? 'v1.4';
        $scale = (int) ($payload['scale'] ?? 2);
        $imageInput = $this->imageUrlToReplicateInput($imageUrl);

        $apiPayload = [
            'version' => self::ENHANCER_MODEL_VERSION,
            'input' => [
                'img' => $imageInput,
                'version' => $version,
                'scale' => $scale,
            ],
        ];

        Log::channel('upscaler')->info('Enhancer create prediction', [
            'shop_domain' => $shopDomain,
            'version' => $version,
            'scale' => $scale,
        ]);

        $response = Http::withToken($token)
            ->timeout(30)
            ->post(self::REPLICATE_API, $apiPayload);

        $statusCode = $response->status();
        $body = $response->json() ?? [];

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            Log::channel('upscaler')->warning('Enhancer create failed', ['status' => $statusCode, 'detail' => $detail]);
            throw new \RuntimeException(is_string($detail) ? $detail : 'Enhance request failed. Please try again.');
        }

        $predictionId = $body['id'] ?? null;
        if (empty($predictionId)) {
            throw new \RuntimeException('Enhancer did not return a job ID.');
        }

        $generation = ImageGeneration::create([
            'shop_domain' => $shopDomain,
            'tool_used' => 'enhance',
            'api_job_id' => $predictionId,
            'original_image_url' => $imageUrl,
            'result_image_url' => null,
            'shopify_product_id' => null,
            'status' => 'processing',
            'error_message' => null,
            'processing_time_seconds' => null,
        ]);

        return [
            'status' => 'processing',
            'job_id' => $predictionId,
            'generation_id' => $generation->id,
        ];
    }

    /**
     * Start a lighting fix (relighting) job via Replicate IC-Light.
     * Creates ImageGeneration with tool_used = 'lighting', status = 'processing'.
     */
    public function startLightingJob(string $imageUrl, string $prompt, string $shopDomain): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Lighting fix is not configured.');
        }

        $prompt = trim($prompt);
        if ($prompt === '') {
            throw new \InvalidArgumentException('Prompt is required for lighting fix.');
        }
        if (! $imageUrl) {
            throw new \InvalidArgumentException('Image URL is required for lighting fix.');
        }

        $imageInput = $this->imageUrlToReplicateInput($imageUrl);

        $apiPayload = [
            'version' => self::IC_LIGHT_MODEL_VERSION,
            'input' => [
                'subject_image' => $imageInput,
                'prompt' => $prompt,
                'appended_prompt' => 'best quality, sharp, high detail, preserve exact face and body proportions, no distortion, professional photography, original resolution',
                'negative_prompt' => 'blurry, deformed face, changed proportions, distorted features, low quality, lowres, bad anatomy, worst quality',
            ],
        ];

        Log::channel('upscaler')->info('Lighting fix create prediction', [
            'shop_domain' => $shopDomain,
        ]);

        $response = Http::withToken($token)
            ->timeout(30)
            ->post(self::REPLICATE_API, $apiPayload);

        $statusCode = $response->status();
        $body = $response->json() ?? [];

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            Log::channel('upscaler')->warning('Lighting fix create failed', ['status' => $statusCode, 'detail' => $detail]);
            throw new \RuntimeException(is_string($detail) ? $detail : 'Lighting fix request failed. Please try again.');
        }

        $predictionId = $body['id'] ?? null;
        if (empty($predictionId)) {
            throw new \RuntimeException('Lighting fix did not return a job ID.');
        }

        $generation = ImageGeneration::create([
            'shop_domain' => $shopDomain,
            'tool_used' => 'lighting',
            'api_job_id' => $predictionId,
            'original_image_url' => $imageUrl,
            'result_image_url' => null,
            'shopify_product_id' => null,
            'status' => 'processing',
            'error_message' => null,
            'processing_time_seconds' => null,
        ]);

        return [
            'status' => 'processing',
            'job_id' => $predictionId,
            'generation_id' => $generation->id,
        ];
    }

    private function checkBackgroundRemovalStatus(string $jobId): array
    {
        $generation = ImageGeneration::where('api_job_id', $jobId)->first();

        try {
            $result = $this->backgroundRemover->checkJobStatus($jobId);

            if (($result['status'] ?? '') === 'completed' && ! empty($result['result_url'] ?? null) && $generation) {
                $generation->update([
                    'result_image_url' => $result['result_url'],
                    'status' => 'completed',
                ]);
                AppStat::incrementKey('bg_remover_success_count');
            }

            return [
                'status' => $result['status'],
                'job_id' => $result['job_id'] ?? $jobId,
                'result_url' => $result['result_url'] ?? null,
                'generation_id' => $generation?->id,
            ];
        } catch (\Exception $e) {
            if ($generation) {
                $generation->update([
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                ]);
                AppStat::incrementKey('bg_remover_failed_count');
            }
            Log::channel('bg_remover')->info('checkJobStatus error', ['job_id' => $jobId, 'error' => $e->getMessage()]);

            return [
                'status' => 'error',
                'message' => $e->getMessage(),
            ];
        }
    }

    private function checkUpscalerStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Upscaler is not configured.');
        }

        $generation = ImageGeneration::where('api_job_id', $jobId)
            ->where('tool_used', 'upscaler')
            ->first();

        try {
            $url = self::REPLICATE_API . '/' . $jobId;
            $response = Http::withToken($token)->timeout(15)->get($url);
            $data = $response->json() ?? [];
            $status = $data['status'] ?? '';

            if ($status === 'succeeded') {
                $output = $data['output'] ?? null;
                $resultUrl = is_string($output) ? $output : (is_array($output) ? ($output['url'] ?? $output[0] ?? null) : null);

                if ($resultUrl && $generation) {
                    $storedUrl = $this->storeProcessedImageFromUrl($resultUrl, 'upscale');
                    if ($storedUrl) {
                        $resultUrl = $storedUrl;
                    }
                    $generation->update([
                        'result_image_url' => $resultUrl,
                        'status' => 'completed',
                    ]);
                    AppStat::incrementKey('upscaler_success_count');
                }

                return [
                    'status' => 'completed',
                    'job_id' => $jobId,
                    'result_url' => $resultUrl ?? null,
                    'generation_id' => $generation?->id,
                ];
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error = $data['error'] ?? $data['logs'] ?? 'Unknown error';
                if ($generation) {
                    $generation->update([
                        'status' => 'failed',
                        'error_message' => is_string($error) ? $error : json_encode($error),
                    ]);
                    AppStat::incrementKey('upscaler_failed_count');
                }

                return [
                    'status' => 'error',
                    'message' => is_string($error) ? $error : 'Job failed.',
                ];
            }

            return [
                'status' => 'processing',
                'job_id' => $jobId,
            ];
        } catch (\Throwable $e) {
            if (isset($generation)) {
                $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                AppStat::incrementKey('upscaler_failed_count');
            }
            Log::channel('upscaler')->error('Upscaler poll error', ['job_id' => $jobId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function checkMagicEraserStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Magic eraser is not configured.');
        }

        $generation = ImageGeneration::where('api_job_id', $jobId)
            ->where('tool_used', 'magic_eraser')
            ->first();

        try {
            $url = self::REPLICATE_API . '/' . $jobId;
            $response = Http::withToken($token)->timeout(15)->get($url);
            $data = $response->json() ?? [];
            $status = $data['status'] ?? '';

            Log::channel('magic_eraser')->info('Magic eraser poll', ['job_id' => $jobId, 'status' => $status]);

            if ($status === 'succeeded') {
                $output = $data['output'] ?? null;
                $resultUrl = $this->extractResultUrlFromReplicateOutput($output);
                if ($resultUrl === null) {
                    $resultUrl = $this->extractFirstUrlFromArray($data);
                }
                for ($retry = 0; $resultUrl === null && $retry < 3; $retry++) {
                    sleep($retry + 1);
                    $response = Http::withToken($token)->timeout(15)->get($url);
                    $data = $response->json() ?? [];
                    $output = $data['output'] ?? null;
                    $resultUrl = $this->extractResultUrlFromReplicateOutput($output) ?? $this->extractFirstUrlFromArray($data);
                }
                if ($resultUrl === null) {
                    $streamUrl = $data['urls']['stream'] ?? null;
                    if ($streamUrl && is_string($streamUrl)) {
                        $resultUrl = $this->fetchAndStoreFromReplicateStreamUrl($streamUrl, $token, 'magic_eraser');
                        if ($resultUrl) {
                            Log::channel('magic_eraser')->info('Magic eraser completed via stream URL (poll)', ['job_id' => $jobId]);
                        }
                    }
                    if ($resultUrl === null) {
                        $safe = $data;
                        unset($safe['input'], $safe['logs']);
                        $sample = json_encode($safe);
                        if (strlen($sample) > 1500) {
                            $sample = substr($sample, 0, 1500) . '...';
                        }
                        Log::channel('magic_eraser')->warning('Magic eraser succeeded but no URL in response', ['job_id' => $jobId, 'response_keys' => array_keys($data), 'output_raw' => $output, 'response_sample' => $sample]);
                    }
                }

                if ($resultUrl && $generation) {
                    $storedUrl = $this->storeProcessedImageFromUrl($resultUrl, 'magic_eraser');
                    if ($storedUrl) {
                        $resultUrl = $storedUrl;
                    }
                    $generation->update([
                        'result_image_url' => $resultUrl,
                        'status' => 'completed',
                    ]);
                    AppStat::incrementKey('magic_eraser_success_count');
                }

                return [
                    'status' => 'completed',
                    'job_id' => $jobId,
                    'result_url' => $resultUrl ?? null,
                    'generation_id' => $generation?->id,
                ];
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error = $data['error'] ?? $data['logs'] ?? 'Unknown error';
                if ($generation) {
                    $generation->update([
                        'status' => 'failed',
                        'error_message' => is_string($error) ? $error : json_encode($error),
                    ]);
                    AppStat::incrementKey('magic_eraser_failed_count');
                }
                Log::channel('magic_eraser')->info('Magic eraser job failed', ['job_id' => $jobId, 'error' => $error]);
                return [
                    'status' => 'error',
                    'message' => is_string($error) ? $error : 'Job failed.',
                ];
            }

            return [
                'status' => 'processing',
                'job_id' => $jobId,
            ];
        } catch (\Throwable $e) {
            if (isset($generation)) {
                $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                AppStat::incrementKey('magic_eraser_failed_count');
            }
            Log::channel('magic_eraser')->error('Magic eraser poll error', ['job_id' => $jobId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function checkEnhanceStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Image enhancer is not configured.');
        }

        $generation = ImageGeneration::where('api_job_id', $jobId)
            ->where('tool_used', 'enhance')
            ->first();

        try {
            $url = self::REPLICATE_API . '/' . $jobId;
            $response = Http::withToken($token)->timeout(15)->get($url);
            $data = $response->json() ?? [];
            $status = $data['status'] ?? '';

            if ($status === 'succeeded') {
                $output = $data['output'] ?? null;
                $resultUrl = is_string($output) ? $output : (is_array($output) ? ($output['url'] ?? $output[0] ?? null) : null);
                if ($resultUrl === null && is_array($output)) {
                    $resultUrl = $this->extractResultUrlFromReplicateOutput($output);
                }
                if ($resultUrl === null) {
                    $resultUrl = $this->extractFirstUrlFromArray($data);
                }

                if ($resultUrl && $generation) {
                    $storedUrl = $this->storeProcessedImageFromUrl($resultUrl, 'enhance');
                    if ($storedUrl) {
                        $resultUrl = $storedUrl;
                    }
                    $generation->update([
                        'result_image_url' => $resultUrl,
                        'status' => 'completed',
                    ]);
                    AppStat::incrementKey('enhance_success_count');
                }

                return [
                    'status' => 'completed',
                    'job_id' => $jobId,
                    'result_url' => $resultUrl ?? null,
                    'generation_id' => $generation?->id,
                ];
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error = $data['error'] ?? $data['logs'] ?? 'Unknown error';
                if ($generation) {
                    $generation->update([
                        'status' => 'failed',
                        'error_message' => is_string($error) ? $error : json_encode($error),
                    ]);
                    AppStat::incrementKey('enhance_failed_count');
                }

                return [
                    'status' => 'error',
                    'message' => is_string($error) ? $error : 'Job failed.',
                ];
            }

            return [
                'status' => 'processing',
                'job_id' => $jobId,
            ];
        } catch (\Throwable $e) {
            if (isset($generation)) {
                $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                AppStat::incrementKey('enhance_failed_count');
            }
            Log::channel('upscaler')->error('Enhancer poll error', ['job_id' => $jobId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    private function checkLightingStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Lighting fix is not configured.');
        }

        $generation = ImageGeneration::where('api_job_id', $jobId)
            ->where('tool_used', 'lighting')
            ->first();

        try {
            $url = self::REPLICATE_API . '/' . $jobId;
            $response = Http::withToken($token)->timeout(15)->get($url);
            $data = $response->json() ?? [];
            $status = $data['status'] ?? '';

            if ($status === 'succeeded') {
                $resultUrl = null;
                $output = $data['output'] ?? null;
                $rawResultUrl = is_string($output) ? $output : (is_array($output) ? ($output['url'] ?? $output[0] ?? null) : null);
                if ($rawResultUrl === null && is_array($output)) {
                    $rawResultUrl = $this->extractResultUrlFromReplicateOutput($output);
                }
                if ($rawResultUrl === null) {
                    $rawResultUrl = $this->extractFirstUrlFromArray($data);
                }
                if ($rawResultUrl === null) {
                    $streamUrl = $data['urls']['stream'] ?? null;
                    if ($streamUrl && is_string($streamUrl)) {
                        $rawResultUrl = $this->fetchAndStoreFromReplicateStreamUrl($streamUrl, $token, 'lighting');
                        if ($rawResultUrl) {
                            $resultUrl = $rawResultUrl;
                        }
                    }
                }

                if ($resultUrl === null && $rawResultUrl && is_string($rawResultUrl)) {
                    $resultUrl = $this->storeProcessedImageFromUrlWithToken($rawResultUrl, $token, 'lighting');
                }
                if ($resultUrl && $generation) {
                    $generation->update([
                        'result_image_url' => $resultUrl,
                        'status' => 'completed',
                    ]);
                    AppStat::incrementKey('lighting_success_count');
                } elseif ($rawResultUrl && $generation) {
                    $generation->update([
                        'status' => 'failed',
                        'error_message' => 'Result image could not be saved. Please try again.',
                    ]);
                    AppStat::incrementKey('lighting_failed_count');
                    return [
                        'status' => 'error',
                        'message' => 'Result image could not be saved. Please try again.',
                    ];
                }

                return [
                    'status' => $resultUrl ? 'completed' : 'processing',
                    'job_id' => $jobId,
                    'result_url' => $resultUrl,
                    'generation_id' => $generation?->id,
                ];
            }

            if (in_array($status, ['failed', 'canceled'], true)) {
                $error = $data['error'] ?? $data['logs'] ?? 'Unknown error';
                if ($generation) {
                    $generation->update([
                        'status' => 'failed',
                        'error_message' => is_string($error) ? $error : json_encode($error),
                    ]);
                    AppStat::incrementKey('lighting_failed_count');
                }

                return [
                    'status' => 'error',
                    'message' => is_string($error) ? $error : 'Job failed.',
                ];
            }

            return [
                'status' => 'processing',
                'job_id' => $jobId,
            ];
        } catch (\Throwable $e) {
            if (isset($generation)) {
                $generation->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
                AppStat::incrementKey('lighting_failed_count');
            }
            Log::channel('upscaler')->error('Lighting fix poll error', ['job_id' => $jobId, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * True if the URL is likely an image/file (Replicate delivery, our storage, or common CDNs).
     * Avoids returning API URLs like https://api.replicate.com/v1/predictions/...
     */
    private function isLikelyImageOrFileUrl(string $url): bool
    {
        $url = strtolower($url);
        if (str_contains($url, 'api.replicate.com')) {
            return false;
        }
        return str_contains($url, 'replicate.delivery')
            || str_contains($url, '/storage/')
            || str_contains($url, 'pb.replicate.delivery')
            || str_contains($url, 'replicate.delivery');
    }

    /**
     * Extract a single image URL from Replicate prediction output (string, array, or object).
     * Replicate may return output as a plain URL string, { "url": "..." }, or an object with the URL under any key.
     */
    private function extractResultUrlFromReplicateOutput(mixed $output): ?string
    {
        $candidates = [];
        if (is_string($output) && $output !== '' && str_starts_with($output, 'http')) {
            $candidates[] = $output;
        }
        if (is_array($output)) {
            if (isset($output['url']) && is_string($output['url']) && str_starts_with($output['url'], 'http')) {
                $candidates[] = $output['url'];
            }
            if (isset($output[0])) {
                $first = $output[0];
                if (is_string($first) && str_starts_with($first, 'http')) {
                    $candidates[] = $first;
                }
                if (is_array($first) && isset($first['url']) && is_string($first['url'])) {
                    $candidates[] = $first['url'];
                }
            }
            foreach ($output as $value) {
                if (is_string($value) && str_starts_with($value, 'http')) {
                    $candidates[] = $value;
                }
                if (is_array($value) && isset($value['url']) && is_string($value['url'])) {
                    $candidates[] = $value['url'];
                }
            }
        }
        foreach ($candidates as $url) {
            if ($this->isLikelyImageOrFileUrl($url)) {
                return $url;
            }
        }
        return null;
    }

    /**
     * Recursively find the first string that looks like an image/file URL in an array.
     * Skips API URLs (e.g. api.replicate.com) so we never return a non-image link.
     */
    private function extractFirstUrlFromArray(array $arr, int $depth = 0): ?string
    {
        if ($depth > 10) {
            return null;
        }
        foreach ($arr as $value) {
            if (is_string($value) && str_starts_with($value, 'http') && $this->isLikelyImageOrFileUrl($value)) {
                return $value;
            }
            if (is_array($value)) {
                $found = $this->extractFirstUrlFromArray($value, $depth + 1);
                if ($found !== null) {
                    return $found;
                }
            }
        }
        return null;
    }
}
