<?php

namespace App\Services;

use App\Models\ImageGeneration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Universal Product Studio AI service.
 *
 * Handles prompt engineering and payload construction for the native multimodal
 * AI API.  Supports any product category (watches, bags, shoes, backgrounds …)
 * through a single, structured API call that accepts:
 *   - A product image  (base64)
 *   - Up to three reference images  (style / face / pose)
 *   - A compiled text prompt
 *
 * The actual HTTP request is intentionally mocked via `callMultimodalApi()`.
 * Replace that method's body with the real provider call when credentials are
 * available.  Config keys expected in config/services.php:
 *   services.multimodal.endpoint
 *   services.multimodal.api_key
 */
class AiUniversalService
{
    /**
     * System-level instruction prepended to every prompt.
     * Ensures product fidelity is preserved regardless of scene changes.
     */
    private const SYSTEM_PROMPT =
        'You are an elite product photography AI. '
        . 'Preserve the EXACT pixels, logos, text, and structural integrity of the main product image. '
        . 'Do not alter the product\'s shape, proportions, or branding in any way.';

    // ─────────────────────────────────────────────────────────────────────────
    // Public interface
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a product scene using the native multimodal AI pipeline.
     *
     * @param  string  $mainImageUrl     Publicly accessible URL of the uploaded product.
     * @param  string  $userPrompt       Scene description text entered by the merchant.
     * @param  string  $intent           'human' | 'environment'
     * @param  array   $referenceImages  Assoc array keyed by slot: ['style' => base64, 'face' => base64, 'pose' => base64].
     * @param  string  $shopDomain       Merchant shop domain for record-keeping.
     * @param  int     $credits          Credits already deducted for this run.
     * @return array                     Standard result array consumed by the controller.
     */
    public function generateMultimodal(
        string $mainImageUrl,
        string $userPrompt,
        string $intent,
        array  $referenceImages,
        string $shopDomain,
        int    $credits,
    ): array {
        // Create the generation record immediately so the gallery updates in
        // real-time even before we get a result back.
        $generation = ImageGeneration::create([
            'shop_domain'        => $shopDomain,
            'tool_used'          => 'ai_universal',
            'original_image_url' => $mainImageUrl,
            'status'             => 'processing',
            'credits_used'       => $credits,
        ]);

        try {
            // 1. Build the fully compiled prompt
            $compiledPrompt = $this->buildPrompt($userPrompt, $intent, $referenceImages);

            // 2. Fetch + encode the main product image to base64
            $mainImageBase64 = $this->encodeRemoteImage($mainImageUrl);

            // 3. Assemble the structured API payload
            $payload = $this->buildApiPayload($compiledPrompt, $mainImageBase64, $referenceImages);

            // 4. Execute the API call (mocked — replace when ready)
            $apiResponse = $this->callMultimodalApi($payload);

            // 5. Persist the result image locally and return a stable URL
            $resultUrl = $this->storeResultImage($apiResponse, $shopDomain);

            $generation->update([
                'result_image_url' => $resultUrl,
                'status'           => 'completed',
            ]);

            return [
                'success'    => true,
                'result_url' => $resultUrl,
                'generation' => $generation->fresh()->only([
                    'id', 'tool_used', 'result_image_url', 'original_image_url',
                    'status', 'credits_used', 'created_at',
                ]),
            ];

        } catch (\Throwable $e) {
            Log::error('AiUniversalService: generation failed', [
                'shop'  => $shopDomain,
                'error' => $e->getMessage(),
            ]);

            $generation->update([
                'status'        => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            // Re-throw so the controller can handle the credit refund.
            throw $e;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Prompt Engineering
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Compile the final prompt by layering:
     *   1. System fidelity instruction
     *   2. Intent-specific composition directive
     *   3. Merchant's free-text scene description
     *   4. (Conditional) reference-image style directives
     */
    private function buildPrompt(string $userPrompt, string $intent, array $referenceImages): string
    {
        $intentInstruction = $intent === 'human'
            ? 'Place the product on a human model in a natural, commercially compelling way. '
              . 'The model should complement the product without overpowering it.'
            : 'Create a high-end environmental product scene that highlights the product\'s premium qualities.';

        $parts = array_filter([
            self::SYSTEM_PROMPT,
            $intentInstruction,
            $userPrompt !== '' ? $userPrompt : null,
            ! empty($referenceImages) ? $this->buildReferenceInstruction($referenceImages) : null,
        ]);

        return implode("\n\n", $parts);
    }

    /**
     * Build the mandatory style instruction appended when reference images are
     * present.  Each occupied slot adds a targeted directive.
     */
    private function buildReferenceInstruction(array $referenceImages): string
    {
        $directives = [
            'Mandatory Style Instruction: Strictly match the lighting, mood, and color palette '
            . 'of the provided style reference images.',
        ];

        if (isset($referenceImages['face'])) {
            $directives[] = 'Use the provided face reference image to define the human model\'s facial features exactly.';
        }

        if (isset($referenceImages['pose'])) {
            $directives[] = 'Adopt the body pose and compositional framing shown in the pose reference image.';
        }

        return implode(' ', $directives);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API Payload Construction
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Construct the JSON payload for the native multimodal API.
     *
     * Payload schema:
     * {
     *   "model":   "...",
     *   "messages": [
     *     { "role": "system", "content": "<system_prompt>" },
     *     { "role": "user",   "content": "<compiled_prompt>" }
     *   ],
     *   "images": [
     *     { "role": "product", "data": "<base64>", "mime_type": "image/jpeg" },
     *     { "role": "style",   "data": "<base64>", "mime_type": "image/jpeg" },
     *     ...
     *   ],
     *   "output_format":    "jpeg",
     *   "output_quality":   95,
     *   "preserve_product": true
     * }
     */
    private function buildApiPayload(
        string $compiledPrompt,
        string $mainImageBase64,
        array  $referenceImages,
    ): array {
        // Always include the product image first in the images array
        $imageInputs = [
            [
                'role'      => 'product',
                'data'      => $mainImageBase64,
                'mime_type' => 'image/jpeg',
            ],
        ];

        // Append each reference slot in the order provided (style → face → pose)
        foreach ($referenceImages as $slot => $base64Data) {
            $imageInputs[] = [
                'role'      => (string) $slot,   // 'style' | 'face' | 'pose'
                'data'      => $base64Data,
                'mime_type' => 'image/jpeg',
            ];
        }

        return [
            'model'    => config('services.multimodal.model', 'native-multimodal-v1'),
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => self::SYSTEM_PROMPT,
                ],
                [
                    'role'    => 'user',
                    'content' => $compiledPrompt,
                ],
            ],
            'images'           => $imageInputs,
            'output_format'    => 'jpeg',
            'output_quality'   => 95,
            'preserve_product' => true,
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API Call (mocked)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Submit the payload to the native multimodal API endpoint.
     *
     * ┌─────────────────────────────────────────────────────────────────────┐
     * │  MOCK IMPLEMENTATION                                                │
     * │                                                                     │
     * │  Replace the body of this method with the real provider call:      │
     * │                                                                     │
     * │  $response = Http::withToken(config('services.multimodal.api_key'))│
     * │      ->timeout(120)                                                 │
     * │      ->post(config('services.multimodal.endpoint'), $payload);     │
     * │                                                                     │
     * │  if (! $response->successful()) {                                   │
     * │      throw new \RuntimeException(                                   │
     * │          'Multimodal API error: ' . $response->body()              │
     * │      );                                                             │
     * │  }                                                                  │
     * │                                                                     │
     * │  return $response->json();                                          │
     * └─────────────────────────────────────────────────────────────────────┘
     *
     * @param  array  $payload  The fully constructed API payload from buildApiPayload().
     * @return array            API response containing at minimum 'result_url'.
     */
    private function callMultimodalApi(array $payload): array
    {
        Log::info('AiUniversalService: callMultimodalApi (mock)', [
            'model'          => $payload['model'],
            'image_count'    => count($payload['images']),
            'prompt_preview' => Str::limit($payload['messages'][1]['content'] ?? '', 120),
        ]);

        // Mock response — swap for the real provider URL once integrated
        return [
            'status'     => 'success',
            'result_url' => 'https://via.placeholder.com/1024x1024/0f0f1a/e2e8f0?text=AI+Studio+Pro+%E2%80%94+Mock+Result',
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Fetch a remote image and return its base64-encoded body.
     *
     * @throws \RuntimeException if the image cannot be downloaded.
     */
    private function encodeRemoteImage(string $imageUrl): string
    {
        $response = Http::timeout(30)->get($imageUrl);

        if (! $response->successful()) {
            throw new \RuntimeException(
                "Failed to download product image (HTTP {$response->status()}): {$imageUrl}"
            );
        }

        return base64_encode($response->body());
    }

    /**
     * Download the result image from the API response and persist it on the
     * public storage disk, returning a stable application URL.
     *
     * Falls back to returning the remote URL directly for placeholder/mock
     * responses to avoid unnecessary HTTP traffic during development.
     */
    private function storeResultImage(array $apiResponse, string $shopDomain): string
    {
        $remoteUrl = $apiResponse['result_url']
            ?? throw new \RuntimeException('API response is missing result_url.');

        // Skip download for placeholder/mock URLs to keep dev logs clean
        if (str_contains($remoteUrl, 'placeholder.com')) {
            return $remoteUrl;
        }

        $imageContent = Http::timeout(60)->get($remoteUrl)->throw()->body();

        $fileName = 'ai-universal-' . Str::uuid() . '.jpg';
        Storage::disk('public')->put("generated/{$fileName}", $imageContent);

        return Storage::disk('public')->url("generated/{$fileName}");
    }
}
