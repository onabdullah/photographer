<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\ImageGeneration;
use App\Models\Merchant;
use App\Services\AiFashionService;
use App\Services\AiGenerationService;
use App\Services\AiUniversalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Smart Router for AI Studio Pro.
 *
 * Single generation endpoint that inspects `product_category` and dispatches:
 *   - 'apparel'   → VTON pipeline  (AiFashionService — IDM-VTON / Kolors)
 *   - 'universal' → Multimodal AI  (AiUniversalService — native multimodal API)
 */
class AiRouterController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private readonly AiGenerationService $aiGenerationService,
        private readonly AiUniversalService  $aiUniversalService,
        private readonly AiFashionService    $aiFashionService,
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Page
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Render the AI Studio Pro Inertia page.
     */
    public function show(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated.');
        }

        $credits = (int) ($shop->ai_credits_balance ?? 0);

        $recentGenerations = ImageGeneration::where('shop_domain', $shop->name)
            ->whereIn('tool_used', ['ai_vton', 'ai_universal'])
            ->whereNotNull('result_image_url')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get(['id', 'tool_used', 'result_image_url', 'original_image_url', 'status', 'credits_used', 'created_at'])
            ->toArray();

        return Inertia::render('Shopify/AiStudioPro', [
            'credits'           => $credits,
            'recentGenerations' => $recentGenerations,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Smart Router
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /shopify/ai-studio/generate
     *
     * Validates input, deducts credits atomically, then dispatches to the
     * appropriate AI pipeline based on product_category.
     */
    public function generate(Request $request): JsonResponse
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        // ── Input validation ──────────────────────────────────────────────
        $request->validate([
            'product_category'   => 'required|in:apparel,universal',
            'image'              => 'required|file|image|mimes:jpeg,png,jpg,webp|max:15360',
            'prompt'             => 'nullable|string|max:2000',
            'intent'             => 'nullable|string|in:human,environment',
            'model_image'        => 'nullable|file|image|mimes:jpeg,png,jpg,webp|max:10240',
            'model_preset'       => 'nullable|string|max:64',
            'reference_images'   => 'nullable|array|max:3',
            'reference_images.*' => 'file|image|mimes:jpeg,png,jpg,webp|max:10240',
        ]);

        $category  = $request->input('product_category');
        $hasRefs   = $request->hasFile('reference_images') && count($request->file('reference_images')) > 0;
        $creditCost = $this->resolveCreditCost($category, $hasRefs);

        // ── Atomic credit deduction ───────────────────────────────────────
        try {
            DB::transaction(function () use ($shopDomain, $creditCost) {
                /** @var Merchant $merchant */
                $merchant = Merchant::where('name', $shopDomain)->lockForUpdate()->firstOrFail();

                if ($merchant->ai_credits_balance < $creditCost) {
                    throw new \DomainException(
                        "Insufficient credits. This generation requires {$creditCost} credit(s), "
                        . "but your balance is {$merchant->ai_credits_balance}."
                    );
                }

                $merchant->decrement('ai_credits_balance', $creditCost);
            });
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 402);
        } catch (\Throwable $e) {
            Log::error('AiRouterController: credit deduction failed', [
                'shop'  => $shopDomain,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Failed to process credits. Please try again.'], 500);
        }

        // ── Dispatch to the correct pipeline ──────────────────────────────
        try {
            $imageUrl = $this->aiGenerationService->resolveImageUrlFromRequest($request);

            if ($category === 'apparel') {
                return $this->routeToFashion($request, $shopDomain, $imageUrl, $creditCost);
            }

            return $this->routeToUniversal($request, $shopDomain, $imageUrl, $creditCost, $hasRefs);

        } catch (\Throwable $e) {
            // Refund credits on pipeline failure
            Merchant::where('name', $shopDomain)->increment('ai_credits_balance', $creditCost);

            Log::error('AiRouterController: generation pipeline failed', [
                'shop'     => $shopDomain,
                'category' => $category,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Generation failed. Your credits have been refunded. ' . $e->getMessage(),
            ], 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Determine the credit cost for this request.
     *
     *   apparel route  → 2 credits (always)
     *   universal, no refs → 2 credits
     *   universal + refs   → 4 credits
     */
    private function resolveCreditCost(string $category, bool $hasRefs): int
    {
        if ($category === 'apparel') {
            return 2;
        }

        return $hasRefs ? 4 : 2;
    }

    /**
     * Route 'apparel' category to the VTON pipeline via AiFashionService.
     *
     * The service call is fully mocked until IDM-VTON / Kolors API credentials
     * are configured.  To activate a live provider, set in .env:
     *
     *   VTON_DRIVER=idm_vton   or   VTON_DRIVER=kolors
     *   IDM_VTON_ENDPOINT=...  IDM_VTON_API_KEY=...
     *   KOLORS_ENDPOINT=...    KOLORS_API_KEY=...
     *
     * Then replace the body of AiFashionService::callVtonApi() with the real
     * HTTP call — no other changes needed anywhere else in the codebase.
     */
    private function routeToFashion(
        Request $request,
        string  $shopDomain,
        string  $imageUrl,
        int     $credits,
    ): JsonResponse {
        $modelImageUrl = null;
        if ($request->hasFile('model_image')) {
            $modelImageUrl = $this->aiGenerationService->resolveImageUrlFromRequest(
                $request,
                'model_image',
            );
        }

        $result = $this->aiFashionService->generateVton(
            garmentImageUrl: $imageUrl,
            modelImageUrl:   $modelImageUrl,
            modelPreset:     $request->input('model_preset', 'auto'),
            shopDomain:      $shopDomain,
            credits:         $credits,
        );

        return response()->json($result, $result['success'] ? 200 : 500);
    }

    /**
     * Route 'universal' category to the native multimodal AI pipeline.
     */
    private function routeToUniversal(
        Request $request,
        string  $shopDomain,
        string  $imageUrl,
        int     $credits,
        bool    $hasRefs,
    ): JsonResponse {
        // Encode reference images to base64 keyed by slot (style/face/pose).
        $referenceImages = [];
        if ($hasRefs) {
            foreach ($request->file('reference_images') as $slot => $file) {
                /** @var \Illuminate\Http\UploadedFile $file */
                $referenceImages[(string) $slot] = base64_encode(
                    file_get_contents($file->getRealPath())
                );
            }
        }

        $result = $this->aiUniversalService->generateMultimodal(
            mainImageUrl:    $imageUrl,
            userPrompt:      $request->input('prompt', ''),
            intent:          $request->input('intent', 'environment'),
            referenceImages: $referenceImages,
            shopDomain:      $shopDomain,
            credits:         $credits,
        );

        $status = $result['success'] ? 200 : 500;

        return response()->json($result, $status);
    }
}
