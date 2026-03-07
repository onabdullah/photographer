<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\ImageGeneration;
use App\Models\Merchant;
use App\Services\AiUniversalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AI Studio Smart Router
 *
 * POST /shopify/api/ai-studio/generate
 *   Validates input, deducts credits, then routes to the correct AI service:
 *     • product_category = 'universal' → AiUniversalService (Nano Banana 2)
 *
 * GET /shopify/api/ai-studio/job/{jobId}
 *   Polls an in-progress async job and returns its current status.
 */
class AiRouterController extends Controller
{
    use GetsCurrentShop;

    public function __construct(
        private AiUniversalService $universalService,
    ) {}

    /* ──────────────────────────────────────────────────────────────
       POST /shopify/api/ai-studio/generate
    ────────────────────────────────────────────────────────────── */
    public function generate(Request $request)
    {
        $shopDomain = $this->shopDomain($request);
        if (! $shopDomain) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        $request->validate([
            'product_category'    => 'required|string|in:universal',
            'main_image'          => 'required',
            'prompt'              => 'nullable|string|max:600',
            'intent'              => 'nullable|string|in:environment,on_human',
            'reference_images'    => 'nullable|array',
            'reference_images.*'  => 'nullable',
        ]);

        $category = $request->input('product_category');

        try {
            /*
             * ── Universal / Accessories / Backgrounds path ──
             * Base cost: 2 credits.  With reference images: 4 credits.
             * Files land in the files bag, NOT in input() — check with allFiles().
             */
            $uploadedRefs = $request->allFiles()['reference_images'] ?? [];
            $hasRefs = is_array($uploadedRefs) && count(array_filter($uploadedRefs)) > 0;

            $credits = $hasRefs ? 4 : 2;
            $newBalance = $this->deductCredits($shopDomain, $credits);
            if ($newBalance === null) {
                return response()->json(['message' => 'Insufficient credits.'], 402);
            }

            $result = $this->universalService->generateNanoBanana($request, $shopDomain);

            return response()->json(array_merge($result, [
                'credits_remaining' => $newBalance,
            ]));
        } catch (\Throwable $e) {
            Log::error('AiRouter generate error', [
                'category' => $category,
                'shop'     => $shopDomain,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);

            $statusCode = str_contains($e->getMessage(), 'not configured') ? 503 : 500;

            return response()->json([
                'message' => $e->getMessage() ?: 'Generation failed. Please try again.',
            ], $statusCode);
        }
    }

    /* ──────────────────────────────────────────────────────────────
       GET /shopify/api/ai-studio/job/{jobId}
    ────────────────────────────────────────────────────────────── */
    public function jobStatus(Request $request, string $jobId)
    {
        if (! $this->shopDomain($request)) {
            return response()->json(['message' => 'Shop not authenticated.'], 403);
        }

        try {
            $result = $this->universalService->checkJobStatus($jobId);

            if (($result['status'] ?? '') === 'error') {
                return response()->json([
                    'status'  => 'error',
                    'message' => $result['message'] ?? 'Job failed.',
                ], 422);
            }

            return response()->json($result);
        } catch (\Throwable $e) {
            Log::error('AiRouter job status error', [
                'job_id' => $jobId,
                'error'  => $e->getMessage(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /* ──────────────────────────────────────────────────────────────
       Credit deduction (atomic, locked transaction)
       Returns new balance, or null if insufficient / merchant not found.
    ────────────────────────────────────────────────────────────── */
    private function deductCredits(string $shopDomain, int $credits): ?int
    {
        return DB::transaction(function () use ($shopDomain, $credits) {
            $merchant = Merchant::where('name', $shopDomain)->lockForUpdate()->first();
            if (! $merchant) {
                return null;
            }

            $balance = (int) ($merchant->ai_credits_balance ?? 0);
            if ($balance < $credits) {
                return null;
            }

            $newBalance = max(0, $balance - $credits);
            $merchant->ai_credits_balance = $newBalance;
            $merchant->save();

            return $newBalance;
        });
    }
}
