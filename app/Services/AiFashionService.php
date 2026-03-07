<?php

namespace App\Services;

use App\Models\ImageGeneration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Apparel & Garment Lab AI service — VTON pipeline.
 *
 * Routes virtual try-on requests to either IDM-VTON or Kolors based on the
 * chosen model preset or the VTON_DRIVER env variable.
 *
 * ── To swap providers without touching call-sites ────────────────────────────
 * Set  VTON_DRIVER=idm_vton  or  VTON_DRIVER=kolors  in your .env file.
 * Each preset ('idm_vton' | 'kolors') will override the env for that run.
 *
 * ── To activate the live API ─────────────────────────────────────────────────
 * Replace the body of callVtonApi() with the real HTTP call.
 * Expected config keys in config/services.php:
 *
 *   services.vton.driver     ('idm_vton' | 'kolors')      — default driver
 *   services.idm_vton.endpoint                            — IDM-VTON API URL
 *   services.idm_vton.api_key
 *   services.kolors.endpoint                              — Kolors API URL
 *   services.kolors.api_key
 */
class AiFashionService
{
    // ─────────────────────────────────────────────────────────────────────────
    // Public interface
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Generate a virtual try-on image using the configured VTON pipeline.
     *
     * @param  string       $garmentImageUrl  URL of the uploaded garment image.
     * @param  string|null  $modelImageUrl    URL of the custom model photo, or null → use preset.
     * @param  string       $modelPreset      'auto' | 'idm_vton' | 'kolors' | 'custom'
     * @param  string       $shopDomain       Merchant shop domain for record-keeping.
     * @param  int          $credits          Credits already deducted for this run.
     * @return array                          Standard result array consumed by the controller.
     */
    public function generateVton(
        string  $garmentImageUrl,
        ?string $modelImageUrl,
        string  $modelPreset,
        string  $shopDomain,
        int     $credits,
    ): array {
        // Create a record immediately so the gallery/dashboard updates in real time.
        $generation = ImageGeneration::create([
            'shop_domain'        => $shopDomain,
            'tool_used'          => 'ai_vton',
            'original_image_url' => $garmentImageUrl,
            'status'             => 'processing',
            'credits_used'       => $credits,
        ]);

        try {
            // 1. Resolve which VTON driver to use for this run
            $driver = $this->resolveDriver($modelPreset);

            // 2. Construct the driver-specific API payload
            $payload = $this->buildVtonPayload($garmentImageUrl, $modelImageUrl, $driver);

            // 3. Submit to the API (mocked — see callVtonApi() doc-block)
            $apiResponse = $this->callVtonApi($payload, $driver);

            $resultUrl = $apiResponse['result_url']
                ?? throw new \RuntimeException('VTON API response is missing result_url.');

            // 4. Optionally persist the result locally for stable serving
            $storedUrl = $this->storeResultImage($resultUrl, $shopDomain);

            $generation->update([
                'result_image_url' => $storedUrl,
                'status'           => 'completed',
            ]);

            return [
                'success'    => true,
                'result_url' => $storedUrl,
                'generation' => $generation->fresh()->only([
                    'id', 'tool_used', 'result_image_url', 'original_image_url',
                    'status', 'credits_used', 'created_at',
                ]),
            ];

        } catch (\Throwable $e) {
            Log::error('AiFashionService: generation failed', [
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
    // Driver resolution
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Determine the VTON API driver for this run.
     *
     *   'auto'     → fall back to VTON_DRIVER env (default: idm_vton)
     *   'custom'   → fall back to VTON_DRIVER env (custom photo, any driver works)
     *   'idm_vton' → force IDM-VTON regardless of env
     *   'kolors'   → force Kolors regardless of env
     */
    private function resolveDriver(string $modelPreset): string
    {
        if (in_array($modelPreset, ['idm_vton', 'kolors'], true)) {
            return $modelPreset;
        }

        // 'auto' and 'custom' fall back to the env-configured default
        return config('services.vton.driver', 'idm_vton');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API payload construction
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Construct the request payload for the selected VTON API.
     * Each driver uses a slightly different schema — centralise that here so
     * callVtonApi() stays clean and provider-agnostic.
     *
     * IDM-VTON payload reference:
     *   https://huggingface.co/spaces/yisol/IDM-VTON
     *
     * Kolors-Virtual-Try-On payload reference:
     *   https://huggingface.co/Kwai-Kolors/Kolors-Virtual-Try-On
     */
    private function buildVtonPayload(
        string  $garmentImageUrl,
        ?string $modelImageUrl,
        string  $driver,
    ): array {
        return match ($driver) {

            'kolors' => [
                'garment_image'  => $garmentImageUrl,
                'model_image'    => $modelImageUrl,
                'output_format'  => 'jpeg',
                'seed'           => -1,           // -1 = random
            ],

            // Default: IDM-VTON
            default => [
                'garm_img'        => $garmentImageUrl,
                'human_img'       => $modelImageUrl,
                'garment_des'     => '',           // optional description
                'is_checked'      => true,
                'is_checked_crop' => false,
                'denoise_steps'   => 30,
                'seed'            => 42,
            ],
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // API call (mocked — replace body when credentials are available)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Submit the VTON payload to the selected API endpoint.
     *
     * ┌─────────────────────────────────────────────────────────────────────┐
     * │  MOCK IMPLEMENTATION                                                │
     * │                                                                     │
     * │  IDM-VTON example:                                                  │
     * │                                                                     │
     * │  $response = Http::withToken(config('services.idm_vton.api_key'))  │
     * │      ->timeout(120)                                                 │
     * │      ->post(config('services.idm_vton.endpoint'), $payload);       │
     * │                                                                     │
     * │  Kolors example:                                                    │
     * │                                                                     │
     * │  $response = Http::withToken(config('services.kolors.api_key'))    │
     * │      ->timeout(120)                                                 │
     * │      ->post(config('services.kolors.endpoint'), $payload);         │
     * │                                                                     │
     * │  if (! $response->successful()) {                                   │
     * │      throw new \RuntimeException(                                   │
     * │          "VTON API ({$driver}) error: " . $response->body()        │
     * │      );                                                             │
     * │  }                                                                  │
     * │                                                                     │
     * │  return $response->json();   // must contain 'result_url'          │
     * └─────────────────────────────────────────────────────────────────────┘
     *
     * @param  array   $payload  Driver-specific payload from buildVtonPayload().
     * @param  string  $driver   'idm_vton' | 'kolors'
     * @return array             API response — must contain at minimum 'result_url'.
     */
    private function callVtonApi(array $payload, string $driver): array
    {
        Log::info('AiFashionService: callVtonApi (mock)', [
            'driver'       => $driver,
            'payload_keys' => array_keys($payload),
        ]);

        // Mock response — swap for the real provider call when credentials are ready
        return [
            'status'     => 'success',
            'result_url' => 'https://via.placeholder.com/768x1024/0f0f1a/e2e8f0?text=VTON+Mock+%E2%80%94+'
                . urlencode(strtoupper($driver)),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Download the result image from the API and persist it on the public disk,
     * returning a stable application URL.  Falls back to the remote URL for
     * placeholder / mock responses to avoid unnecessary HTTP traffic during dev.
     */
    private function storeResultImage(string $remoteUrl, string $shopDomain): string
    {
        // Skip download for placeholder / mock URLs during development
        if (str_contains($remoteUrl, 'placeholder.com')) {
            return $remoteUrl;
        }

        $imageContent = Http::timeout(60)->get($remoteUrl)->throw()->body();
        $fileName     = 'ai-vton-' . Str::uuid() . '.jpg';

        Storage::disk('public')->put("generated/{$fileName}", $imageContent);

        return Storage::disk('public')->url("generated/{$fileName}");
    }
}
