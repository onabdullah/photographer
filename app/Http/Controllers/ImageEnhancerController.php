<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;

/**
 * Modular AI Image Enhancer (Replicate tencentarc/gfpgan).
 * Thin controller: auth + validation, delegates to AiGenerationService.
 * Uses shared ImageGeneration table with tool_used = 'enhance'.
 */
class ImageEnhancerController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    /**
     * Start an enhance job. Expects multipart: image (file or URL), scale (2-4), face_enhance (optional bool).
     * Returns job_id for polling. Delegates to AiGenerationService.
     */
    public function enhance(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate([
            'image' => 'required',
            'scale' => 'sometimes|integer|in:2,3,4',
            'face_enhance' => 'sometimes|boolean',
        ]);

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            return response()->json(['message' => 'Invalid image: provide a file upload or image URL.'], 422);
        }

        try {
            $payload = [
                'image_url' => $imageUrl,
                'scale' => (int) $request->input('scale', 4),
                'face_enhance' => $request->boolean('face_enhance', false),
            ];
            $result = $this->aiGenerationService->startGeneration('enhance', $payload, $shopDomain);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Enhancer error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;
            return response()->json([
                'message' => $e->getMessage() ?: 'Image enhancer service error. Please try again.',
            ], $statusCode);
        }
    }

    /**
     * Poll enhance job status. On success: completed + result_url. On failure: error + message.
     * Delegates to AiGenerationService.
     */
    public function enhanceJobStatus(Request $request, string $jobId)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        try {
            $result = $this->aiGenerationService->checkStatus($jobId, 'enhance');

            if (($result['status'] ?? '') === 'error') {
                $message = $result['message'] ?? 'Job failed.';
                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                ], 422);
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Enhancer poll error', [
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
