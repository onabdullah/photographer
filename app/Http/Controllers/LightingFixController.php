<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;

/**
 * Modular AI Lighting Fix / Relighting (Replicate IC-Light).
 * Thin controller: auth + validation, delegates to AiGenerationService.
 * Uses shared ImageGeneration table with tool_used = 'lighting'.
 */
class LightingFixController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    /**
     * Start a lighting fix job. Expects multipart: image (file or URL), prompt (string).
     * Returns job_id for polling. No business logic; delegates to AiGenerationService.
     */
    public function lighting(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate([
            'image' => 'required',
            'prompt' => 'required|string|max:1000',
        ]);

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            return response()->json(['message' => 'Invalid image: provide a file upload or image URL.'], 422);
        }

        $prompt = $request->input('prompt');

        try {
            $result = $this->aiGenerationService->startLightingJob($imageUrl, $prompt, $shopDomain);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Lighting fix error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;
            return response()->json([
                'message' => $e->getMessage() ?: 'Lighting fix service error. Please try again.',
            ], $statusCode);
        }
    }

    /**
     * Poll lighting job status. On success: completed + result_url. On failure: error + message.
     * Delegates to AiGenerationService::checkStatus($jobId, 'lighting').
     */
    public function lightingJobStatus(Request $request, string $jobId)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        try {
            $result = $this->aiGenerationService->checkStatus($jobId, 'lighting');

            if (($result['status'] ?? '') === 'error') {
                $message = $result['message'] ?? 'Job failed.';
                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                ], 422);
            }

            // Ensure result_url is absolute and uses current request host so the image loads in embedded iframes
            $resultUrl = $result['result_url'] ?? null;
            if ($resultUrl && is_string($resultUrl)) {
                if (str_starts_with($resultUrl, '/')) {
                    $result['result_url'] = rtrim($request->getSchemeAndHttpHost(), '/') . $resultUrl;
                } else {
                    // If URL is absolute but points to our storage path, rewrite to current host (fixes wrong APP_URL)
                    $path = parse_url($resultUrl, PHP_URL_PATH);
                    if ($path && str_starts_with($path, '/storage/')) {
                        $result['result_url'] = rtrim($request->getSchemeAndHttpHost(), '/') . $path;
                    }
                }
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Lighting fix poll error', [
                'job_id' => $jobId,
                'error' => $e->getMessage(),
            ]);
            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], $statusCode);
        }
    }
}
