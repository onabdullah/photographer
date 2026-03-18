<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\ImageGeneration;
use App\Models\Merchant;
use App\Services\AiUniversalService;
use App\Services\MerchantCreditService;
use App\Services\MerchantCreditThresholdNotifier;
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
            'aspect_ratio'        => 'nullable|string|in:match_input_image,1:1,1:4,1:8,2:3,3:2,3:4,4:1,4:3,4:5,5:4,8:1,9:16,16:9,21:9',
            'resolution'          => 'nullable|string|in:1K,2K,4K',
            'output_format'       => 'nullable|string|in:jpg,png',
            'google_search'       => 'nullable|boolean',
            'image_search'        => 'nullable|boolean',
            'seed'                => 'nullable|integer|min:0|max:2147483647',
            'reference_images'    => 'nullable|array',
            'reference_images.*'  => 'nullable',
        ]);

        $category = $request->input('product_category');

        try {
            /*
             * ── Universal / Accessories / Backgrounds path ──
             * Base cost: 2 credits.
             * Resolution bonus: 2K = +1, 4K = +3.
             * Reference images: +2 credits.
             * Files land in the files bag, NOT in input() — check with allFiles().
             */
            $uploadedRefs = $request->allFiles()['reference_images'] ?? [];
            $hasRefs = is_array($uploadedRefs) && count(array_filter($uploadedRefs)) > 0;

            $resolution = strtoupper($request->input('resolution', '1K'));
            $resolutionBonus = match ($resolution) {
                '4K'    => 3,
                '2K'    => 1,
                default => 0,
            };

            $credits    = 2 + $resolutionBonus + ($hasRefs ? 2 : 0);
            $newBalance = $this->deductCredits($shopDomain, $credits);
            if ($newBalance === null) {
                return response()->json(['message' => 'Insufficient credits.'], 402);
            }

            $result = $this->universalService->generateNanoBanana($request, $shopDomain, $credits);

            return response()->json(array_merge($result, [
                'credits_remaining' => $newBalance,
            ]));
        } catch (\Throwable $e) {
            Log::channel('universal_generate')->error('Generate error', [
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
            Log::channel('universal_generate')->error('Job status error', [
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

            // Gracefully renew subscription credits if cycle has ended
            MerchantCreditService::checkAndRenewSubscription($merchant);

            $summary = MerchantCreditService::getSummary($merchant);
            $availableCredits = (int) ($summary['total_credits'] ?? 0);

            if ($availableCredits < $credits) {
                return null;
            }

            $newSummary = MerchantCreditService::deductCredits($merchant, $credits);
            $newBalance = (int) ($newSummary['total_credits'] ?? 0);

            MerchantCreditThresholdNotifier::notifyOnConsumption($merchant, $availableCredits, $newBalance);

            return $newBalance;
        });
    }
}
