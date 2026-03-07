<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;

/**
 * Image Compressor – Laravel-built compression (GD). Synchronous; no polling.
 * Uses shared ImageGeneration table with tool_used = 'compressor'.
 */
class ImageCompressorController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    /**
     * Compress image. Expects multipart: image (file or URL), optional quality (60–95), max_width, max_height, format (jpeg|png).
     * Returns status completed + result_url + generation_id.
     */
    public function compress(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $validated = $request->validate([
            'image' => 'required',
            'quality' => 'sometimes|nullable|integer|min:60|max:95',
            'max_width' => 'sometimes|nullable|integer|min:1|max:4096',
            'max_height' => 'sometimes|nullable|integer|min:1|max:4096',
            'format' => 'sometimes|nullable|string|in:jpeg,png',
        ]);

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            return response()->json(['message' => 'Invalid image: provide a file upload or image URL.'], 422);
        }

        try {
            $payload = [
                'image_url' => $imageUrl,
                'quality' => isset($validated['quality']) ? (int) $validated['quality'] : 82,
                'max_width' => $validated['max_width'] ?? null,
                'max_height' => $validated['max_height'] ?? null,
                'format' => $validated['format'] ?? 'jpeg',
            ];
            $result = $this->aiGenerationService->startGeneration('compressor', $payload, $shopDomain);
            return response()->json($result);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::channel('upscaler')->error('Compressor error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            $message = $e->getMessage() ?: 'Compression failed. Please try again.';
            $statusCode = str_contains($message, 'Unsupported') || str_contains($message, 'Invalid') ? 422 : 500;
            return response()->json(['message' => $message], $statusCode);
        }
    }
}
