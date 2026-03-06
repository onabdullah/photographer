<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;

/**
 * Magic Eraser (object removal / inpainting) – Replicate LaMa.
 * Thin controller: auth + validation, delegates to AiGenerationService.
 * Expects image (file or URL) and mask_base64 (PNG: white = erase, black = keep).
 */
class MagicEraserController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    /**
     * Start a magic eraser job. Expects multipart: image (file or URL), mask_base64 (optional if reusing).
     */
    public function magicEraser(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate([
            'image' => 'required',
            'mask_base64' => 'required|string',
        ]);

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            return response()->json(['message' => 'Invalid image: provide a file upload or image URL.'], 422);
        }

        $maskBase64 = $request->input('mask_base64');
        if (empty($maskBase64)) {
            return response()->json(['message' => 'Please draw a mask over the area to erase.'], 422);
        }

        try {
            $payload = [
                'image_url' => $imageUrl,
                'mask_base64' => $maskBase64,
            ];
            $result = $this->aiGenerationService->startGeneration('magic_eraser', $payload, $shopDomain);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('magic_eraser')->error('Magic eraser error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;
            return response()->json([
                'message' => $e->getMessage() ?: 'Magic eraser failed. Please try again.',
            ], $statusCode);
        }
    }

    /**
     * Poll magic eraser job status.
     */
    public function magicEraserJobStatus(Request $request, string $jobId)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        try {
            $result = $this->aiGenerationService->checkStatus($jobId, 'magic_eraser');

            if (($result['status'] ?? '') === 'error') {
                $message = $result['message'] ?? 'Job failed.';
                return response()->json([
                    'status' => 'error',
                    'message' => $message,
                ], 422);
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('magic_eraser')->error('Magic eraser poll error', [
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
