<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;

/**
 * Modular AI Image Upscaler (Replicate nightmareai/real-esrgan).
 * Thin controller: auth + validation, delegates to AiGenerationService.
 * Uses shared ImageGeneration table with tool_used = 'upscaler'.
 */
class ImageUpscalerController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    /**
     * Start an upscale job. Expects multipart: image (file or URL), scale (2|4|8), face_enhance (0|1).
     * Returns job_id for polling. Delegates to AiGenerationService.
     */
    public function upscale(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate([
            'image' => 'required',
            'scale' => 'sometimes|integer|in:2,4,8',
            'face_enhance' => 'sometimes|boolean',
        ]);

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            return response()->json(['message' => 'Invalid image: provide a file upload or image URL.'], 422);
        }

        try {
            $payload = [
                'image_url' => $imageUrl,
                'scale' => (int) ($request->input('scale', 4)),
                'face_enhance' => (bool) $request->boolean('face_enhance', false),
            ];
            $result = $this->aiGenerationService->startGeneration('upscaler', $payload, $shopDomain);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Upscaler error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;
            return response()->json([
                'message' => $e->getMessage() ?: 'Upscaler service error. Please try again.',
            ], $statusCode);
        }
    }

    /**
     * Poll upscale job status. On success: completed + result_url. On failure: error + message.
     * Delegates to AiGenerationService.
     */
    public function upscaleJobStatus(Request $request, string $jobId)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        try {
            $result = $this->aiGenerationService->checkStatus($jobId, 'upscaler');

            if (($result['status'] ?? '') === 'error') {
                $message = $result['message'] ?? 'Job failed.';
                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                ], 422);
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Upscaler poll error', [
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
