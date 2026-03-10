<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Http\Traits\UsesShopifyTokenExchange;
use App\Models\ImageGeneration;
use App\Services\AiGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AiStudioController extends Controller
{
    use GetsCurrentShop, UsesShopifyTokenExchange;

    private function bgLog(string $message, array $context = []): void
    {
        Log::channel('bg_remover')->info($message, $context);
    }

    public function __construct(
        private AiGenerationService $aiGenerationService
    ) {}

    // TODO: Implement Bulk Processing feature for Pro users (handling multiple images simultaneously via queued jobs).

    /**
     * Remove background using the configured driver (Replicate / Photoroom).
     * Delegates to AiGenerationService for ImageGeneration, AppStat, and API logic.
     */
    public function removeBackground(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $this->bgLog('removeBackground request', [
            'has_file' => $request->hasFile('image'),
            'content_type' => $request->header('Content-Type'),
            'content_length' => $request->header('Content-Length'),
            'image_input' => $request->filled('image') ? (filter_var($request->input('image'), FILTER_VALIDATE_URL) ? '[url]' : '[non-url]') : null,
        ]);

        if ($request->hasFile('image')) {
            $request->validate([
                'image' => 'file|image|max:15360',
            ]);
        }

        $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);
        if (! $imageUrl) {
            $message = 'Please provide an image: upload a file (PNG, JPG, WebP, max 15MB) or use an image URL.';
            if ($request->header('Content-Type') && str_contains($request->header('Content-Type'), 'multipart')) {
                $message = 'The image could not be uploaded. Your server may have an upload limit (e.g. 2MB). Try a smaller image, use Browse from Store, or ask your host to increase upload_max_filesize and post_max_size to at least 18M.';
            }
            $this->bgLog('removeBackground validation failed', [
                'message' => $message,
                'likely_server_limit' => $request->header('Content-Length') && (int) $request->header('Content-Length') > 2 * 1024 * 1024,
            ]);
            return response()->json(['message' => $message], 422);
        }

        try {
            $result = $this->aiGenerationService->startGeneration('remove_bg', ['image_url' => $imageUrl], $shopDomain);
            $this->bgLog('removeBackground response', ['result' => $result]);
            $this->normalizeResultUrl($request, $result);
            return response()->json($result);
        } catch (\Exception $e) {
            $this->bgLog('removeBackground error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            Log::channel('bg_remover')->error('Background removal error', ['error' => $e->getMessage()]);

            $isUnavailable = str_contains($e->getMessage(), 'temporarily unavailable');
            $statusCode = $isUnavailable ? 503 : 500;
            $message = $isUnavailable
                ? $e->getMessage()
                : 'We encountered an issue removing the background. Please try again.';

            return response()->json([
                'message' => $message,
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], $statusCode);
        }
    }

    /**
     * Poll status of an async background-removal job (e.g. Replicate).
     * Delegates to AiGenerationService for status check, DB update, and stats.
     */
    public function checkJobStatus(Request $request, string $jobId)
    {
        $this->bgLog('checkJobStatus request', ['job_id' => $jobId]);

        $result = $this->aiGenerationService->checkStatus($jobId, 'remove_bg');

        $this->bgLog('checkJobStatus response', ['job_id' => $jobId, 'result' => $result]);

        if (($result['status'] ?? '') === 'error') {
            $message = $result['message'] ?? 'An error occurred.';
            $statusCode = str_contains($message, 'temporarily unavailable') ? 503 : 500;
            return response()->json([
                'message' => $message,
                'status' => 'error',
            ], $statusCode);
        }

        $this->normalizeResultUrl($request, $result);
        return response()->json($result);
    }

    /**
     * Ensure result_url is absolute and uses current request host so images load in embedded iframes.
     */
    private function normalizeResultUrl(Request $request, array &$result): void
    {
        $resultUrl = $result['result_url'] ?? null;
        if (! $resultUrl || ! is_string($resultUrl)) {
            return;
        }
        $base = rtrim($request->getSchemeAndHttpHost(), '/');
        if (str_starts_with($resultUrl, '/')) {
            $result['result_url'] = $base . $resultUrl;
        } elseif (($path = parse_url($resultUrl, PHP_URL_PATH)) && str_starts_with($path, '/storage/')) {
            $result['result_url'] = $base . $path;
        }
    }

    /**
     * Get last 50 successful generations for the current shop (for Recent Masterpieces gallery).
     * Normalizes image URLs to the current request host so images load in embedded iframes.
     */
    public function getRecentGenerations(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }
        $generations = ImageGeneration::where('shop_domain', $shopDomain)
            ->where('status', 'completed')
            ->whereNotNull('result_image_url')
            ->orderByDesc('updated_at')
            ->limit(50)
            ->get(['id', 'tool_used', 'original_image_url', 'result_image_url', 'shopify_product_id', 'created_at', 'updated_at']);

        $base = rtrim($request->getSchemeAndHttpHost(), '/');
        $generations = $generations->map(function ($gen) use ($base) {
            $gen = $gen->toArray();
            foreach (['result_image_url', 'original_image_url'] as $key) {
                if (empty($gen[$key]) || ! is_string($gen[$key])) {
                    continue;
                }
                $url = $gen[$key];
                if (str_starts_with($url, '/')) {
                    $gen[$key] = $base . $url;
                } elseif (($path = parse_url($url, PHP_URL_PATH)) && str_starts_with($path, '/storage/')) {
                    $gen[$key] = $base . $path;
                }
            }
            return $gen;
        });

        return response()->json(['generations' => $generations]);
    }

    /**
     * Save a result image URL to the merchant's Shopify Files library via GraphQL fileCreate.
     */
    public function saveToShopify(Request $request)
    {
        $validated = $request->validate([
            'image_url' => 'required|url',
        ]);

        $shop = auth()->guard('shopify')->user() ?? $request->user();
        if (! $shop || ! method_exists($shop, 'api')) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $imageUrl = $validated['image_url'];

        $mutation = <<<'GRAPHQL'
mutation fileCreate($files: [FileCreateInput!]!) {
  fileCreate(files: $files) {
    files { id }
    userErrors { field message }
  }
}
GRAPHQL;

        try {
            $response = $shop->api()->graph($mutation, [
                'files' => [
                    [
                        'originalSource' => $imageUrl,
                    ],
                ],
            ]);

            $body = $response['body'] ?? null;
            if ($body && method_exists($body, 'toArray')) {
                $data = $body->toArray();
            } else {
                $data = is_array($body) ? $body : (isset($body->container) ? $body->container : []);
            }

            $fileCreate = $data['data']['fileCreate'] ?? null;
            $userErrors = $fileCreate['userErrors'] ?? [];

            if (! empty($userErrors)) {
                $message = collect($userErrors)->pluck('message')->implode(' ');

                return response()->json(['message' => $message ?: 'Failed to save file to Shopify.'], 422);
            }

            $files = $fileCreate['files'] ?? [];
            $fileId = $files[0]['id'] ?? null;

            return response()->json([
                'success' => true,
                'message' => 'Image saved to your Shopify Files.',
                'file_id' => $fileId,
            ]);
        } catch (\Exception $e) {
            Log::channel('ai_studio')->error('Save to Shopify error', ['error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Failed to save image to Shopify. Please try again.',
            ], 500);
        }
    }

    /**
     * Assign a generation's result image to a Shopify product (product gallery).
     * Uses the GraphQL Admin API productAppendImages mutation — compatible with API 2024-10+.
     * Requires `write_products` scope. Updates ImageGeneration.shopify_product_id.
     *
     * @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/productAppendImages
     */
    public function assignToProduct(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|string',
            'generation_id' => 'required|integer|exists:image_generations,id',
        ]);
        $shop = auth()->guard('shopify')->user() ?? $request->user();
        if (! $shop || ! method_exists($shop, 'api')) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }
        $shopDomain = $this->shopDomain($request);
        $generation = ImageGeneration::where('id', $validated['generation_id'])
            ->where('shop_domain', $shopDomain)
            ->where('status', 'completed')
            ->whereNotNull('result_image_url')
            ->first();
        if (! $generation) {
            return response()->json(['message' => 'Generation not found or not completed.'], 404);
        }

        $productIdInput = $validated['product_id'];
        // Normalise to GID (accept both numeric ID and full GID)
        if (is_numeric($productIdInput)) {
            $gid = 'gid://shopify/Product/' . $productIdInput;
        } elseif (str_starts_with($productIdInput, 'gid://')) {
            $gid = $productIdInput;
        } else {
            return response()->json(['message' => 'Invalid product.'], 422);
        }
        $numericProductId = (int) preg_replace('/^gid:\/\/shopify\/Product\//', '', $gid);
        if ($numericProductId <= 0) {
            return response()->json(['message' => 'Invalid product.'], 422);
        }

        $mutation = <<<'GRAPHQL'
mutation productAppendImages($input: ProductAppendImagesInput!) {
  productAppendImages(input: $input) {
    newImages { id src }
    userErrors { field message }
  }
}
GRAPHQL;

        try {
            $response = $shop->api()->graph($mutation, [
                'input' => [
                    'id' => $gid,
                    'images' => [
                        ['src' => $generation->result_image_url],
                    ],
                ],
            ]);

            $body = $response['body'] ?? null;
            $data = [];
            if ($body && method_exists($body, 'toArray')) {
                $data = $body->toArray();
            } elseif (is_array($body)) {
                $data = $body;
            } elseif (is_object($body) && isset($body->container)) {
                $data = (array) $body->container;
            }

            $userErrors = $data['data']['productAppendImages']['userErrors'] ?? [];
            if (! empty($userErrors)) {
                $msg = collect($userErrors)->pluck('message')->filter()->implode(' ');
                Log::channel('ai_studio')->warning('productAppendImages userErrors', ['errors' => $userErrors]);
                return response()->json(['message' => $msg ?: 'Could not add image to product.'], 422);
            }

            $newImages = $data['data']['productAppendImages']['newImages'] ?? [];
            if (empty($newImages)) {
                Log::channel('ai_studio')->warning('productAppendImages returned no images', ['data' => $data]);
                return response()->json(['message' => 'Failed to add image to product.'], 422);
            }

            $generation->update(['shopify_product_id' => $numericProductId]);
            return response()->json([
                'success' => true,
                'message' => 'Image added to product gallery.',
            ]);
        } catch (\Exception $e) {
            Log::channel('ai_studio')->error('Assign to product error', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => config('app.debug') ? $e->getMessage() : 'Failed to add image to product. Please try again.',
            ], 500);
        }
    }

    /**
     * Record that a generation was downloaded by the merchant (for admin stats).
     */
    public function markDownloaded(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate(['generation_id' => 'required|integer|min:1']);

        $generation = ImageGeneration::where('id', $request->input('generation_id'))
            ->where('shop_domain', $shopDomain)
            ->first();

        if (! $generation) {
            return response()->json(['message' => 'Generation not found.'], 404);
        }

        if (! $generation->downloaded_at) {
            $generation->update(['downloaded_at' => now()]);
        }

        return response()->json(['ok' => true]);
    }

    public function deleteGeneration(Request $request, int $id)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $generation = ImageGeneration::where('id', $id)
            ->where('shop_domain', $shopDomain)
            ->first();

        if (! $generation) {
            return response()->json(['message' => 'Generation not found.'], 404);
        }

        // Delete the stored file from local disk if it is our own storage URL.
        if ($generation->result_image_url) {
            try {
                $urlPath = parse_url((string) $generation->result_image_url, PHP_URL_PATH);
                if ($urlPath && str_starts_with($urlPath, '/storage/')) {
                    $storagePath = ltrim(substr($urlPath, strlen('/storage')), '/');
                    if (Storage::disk('public')->exists($storagePath)) {
                        Storage::disk('public')->delete($storagePath);
                    }
                }
            } catch (\Throwable) {
                // Non-fatal: proceed with record deletion regardless.
            }
        }

        $generation->delete();

        return response()->json(['ok' => true]);
    }
}
