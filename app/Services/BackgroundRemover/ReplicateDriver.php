<?php

namespace App\Services\BackgroundRemover;

use App\Contracts\BackgroundRemoverInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReplicateDriver implements BackgroundRemoverInterface
{
    private const REPLICATE_API = 'https://api.replicate.com/v1/predictions';

    /**
     * BiRefNet model (ZhengPeng7/BiRefNet equivalent on Replicate).
     * Input: image (URL). Output: image URL.
     */
    private const MODEL_VERSION = 'men1scus/birefnet:f74986db0355b58403ed20963af156525e2891ea3c2d499bfbfb2a28cd87c5d7';

    private function bgLog(string $message, array $context = []): void
    {
        Log::channel('bg_remover')->info($message, array_merge(['driver' => 'ReplicateDriver'], $context));
    }

    public function processImage(string $imageUrl): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Replicate API token is not configured.');
        }

        // When the URL is our own app (e.g. ngrok), Replicate fetching it can get 403 (ngrok browser warning).
        // Send a base64 data URI instead so Replicate never fetches our URL.
        $imageInput = $this->imageUrlToReplicateInput($imageUrl);

        $payload = [
            'version' => self::MODEL_VERSION,
            'input' => [
                'image' => $imageInput,
            ],
        ];
        $this->bgLog('Replicate processImage API request', [
            'url' => self::REPLICATE_API,
            'image_input_type' => str_starts_with($imageInput, 'data:') ? 'data_uri' : 'url',
            'payload' => ['version' => $payload['version'], 'input' => ['image' => str_starts_with($imageInput, 'data:') ? '[data URI]' : $imageInput]],
        ]);

        $response = Http::withToken($token)
            ->timeout(30)
            ->post(self::REPLICATE_API, $payload);

        $statusCode = $response->status();
        $body = $response->json() ?? [];
        $this->bgLog('Replicate processImage API response', [
            'status_code' => $statusCode,
            'response' => $body,
        ]);

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            $this->bgLog('Replicate processImage API error', ['status_code' => $statusCode, 'detail' => $detail]);
            if ($statusCode === 503 || $statusCode === 502 || $statusCode === 504) {
                throw new \RuntimeException('Background removal service is temporarily unavailable. Please try again in a moment.');
            }
            throw new \RuntimeException('Replicate API request failed: ' . (is_string($detail) ? $detail : json_encode($detail)));
        }

        $id = $body['id'] ?? null;
        if (empty($id)) {
            throw new \RuntimeException('Replicate did not return a prediction ID.');
        }

        return [
            'status' => 'processing',
            'job_id' => $id,
            'result_url' => null,
        ];
    }

    public function checkJobStatus(string $jobId): array
    {
        $token = config('services.replicate.token');
        if (empty($token)) {
            throw new \RuntimeException('Replicate API token is not configured.');
        }

        $url = self::REPLICATE_API . '/' . $jobId;
        $this->bgLog('Replicate checkJobStatus API request', ['url' => $url, 'job_id' => $jobId]);

        $response = Http::withToken($token)
            ->timeout(15)
            ->get($url);

        $statusCode = $response->status();
        $data = $response->json() ?? [];
        $this->bgLog('Replicate checkJobStatus API response', [
            'status_code' => $statusCode,
            'job_id' => $jobId,
            'response' => $data,
        ]);

        if (! $response->successful()) {
            $detail = $response->json('detail') ?? $response->body();
            $this->bgLog('Replicate checkJobStatus API error', ['status_code' => $statusCode, 'job_id' => $jobId, 'detail' => $detail]);
            if ($statusCode === 503 || $statusCode === 502 || $statusCode === 504) {
                throw new \RuntimeException('Background removal service is temporarily unavailable. Please try again in a moment.');
            }
            throw new \RuntimeException('Replicate API request failed: ' . (is_string($detail) ? $detail : json_encode($detail)));
        }

        $status = $data['status'] ?? '';

        if ($status === 'succeeded') {
            $cacheKey = 'bg_remover_replicate_job_' . $jobId;
            $cached = Cache::get($cacheKey);
            if (is_array($cached) && isset($cached['result_url'])) {
                $this->bgLog('Replicate checkJobStatus returning cached result', ['job_id' => $jobId]);
                return [
                    'status' => 'completed',
                    'job_id' => $jobId,
                    'result_url' => $cached['result_url'],
                ];
            }

            $metrics = $data['metrics'] ?? null;
            $this->logReplicateCost($jobId, $metrics);

            $output = $data['output'] ?? null;
            $resultUrl = null;

            if (is_string($output)) {
                $resultUrl = $output;
            } elseif (is_array($output)) {
                if (isset($output['url'])) {
                    $resultUrl = $output['url'];
                } elseif (isset($output[0]) && is_string($output[0])) {
                    $resultUrl = $output[0];
                }
            }

            if ($resultUrl) {
                $localPath = $this->storeResultFromUrl($resultUrl, $token);
                $resultUrl = $localPath ? Storage::disk('public')->url($localPath) : $resultUrl;
            }

            Cache::put($cacheKey, ['result_url' => $resultUrl], now()->addHours(1));

            return [
                'status' => 'completed',
                'job_id' => $jobId,
                'result_url' => $resultUrl,
            ];
        }

        if (in_array($status, ['failed', 'canceled'], true)) {
            $error = $data['error'] ?? 'Unknown error';
            throw new \RuntimeException('Replicate job ' . $status . ': ' . $error);
        }

        return [
            'status' => 'processing',
            'job_id' => $jobId,
            'result_url' => null,
        ];
    }

    /**
     * Log Replicate usage/cost. API returns metrics (predict_time, total_time) but not dollar cost.
     * We log metrics and, if price_per_second is configured, estimated cost.
     */
    private function logReplicateCost(string $jobId, ?array $metrics): void
    {
        $payload = [
            'job_id' => $jobId,
            'source' => 'Replicate API response (metrics); actual bill is on Replicate dashboard',
        ];
        if (is_array($metrics)) {
            $predictTime = $metrics['predict_time'] ?? null;
            $totalTime = $metrics['total_time'] ?? null;
            $payload['metrics'] = [
                'predict_time_seconds' => $predictTime,
                'total_time_seconds' => $totalTime,
            ];
            $pricePerSecond = config('services.replicate.price_per_second');
            if ($pricePerSecond !== null && $pricePerSecond > 0 && $predictTime !== null) {
                $payload['estimated_cost_usd'] = round($predictTime * $pricePerSecond, 6);
                $payload['price_per_second_used'] = $pricePerSecond;
            }
        } else {
            $payload['metrics'] = null;
        }
        $this->bgLog('Replicate cost/usage', $payload);
    }

    /**
     * If the image URL is our app (e.g. ngrok), Replicate may get 403 when fetching it.
     * Return a base64 data URI so Replicate never has to fetch our URL.
     */
    private function imageUrlToReplicateInput(string $imageUrl): string
    {
        $appUrl = rtrim(config('app.url'), '/');
        if ($appUrl === '' || ! str_starts_with($imageUrl, $appUrl . '/')) {
            return $imageUrl;
        }

        $path = parse_url($imageUrl, PHP_URL_PATH);
        if ($path === null || $path === '') {
            return $imageUrl;
        }

        // e.g. /storage/ai-studio/uploads/xxx.png -> ai-studio/uploads/xxx.png
        if (str_starts_with($path, '/storage/')) {
            $storagePath = substr($path, strlen('/storage/'));
        } else {
            return $imageUrl;
        }

        if (! Storage::disk('public')->exists($storagePath)) {
            $this->bgLog('Replicate imageUrlToReplicateInput: file not found, passing URL', ['path' => $storagePath]);
            return $imageUrl;
        }

        $contents = Storage::disk('public')->get($storagePath);
        if ($contents === null || $contents === '') {
            return $imageUrl;
        }

        $mime = Storage::disk('public')->mimeType($storagePath) ?: 'image/png';
        $b64 = base64_encode($contents);
        $dataUri = 'data:' . $mime . ';base64,' . $b64;

        $this->bgLog('Replicate imageUrlToReplicateInput: using data URI to avoid 403', [
            'storage_path' => $storagePath,
            'size_bytes' => strlen($contents),
        ]);

        return $dataUri;
    }

    /**
     * Download the result image from Replicate and store it on the public disk.
     */
    private function storeResultFromUrl(string $url, string $token): ?string
    {
        $this->bgLog('Replicate storeResultFromUrl', ['result_url' => $url]);
        try {
            $response = Http::withToken($token)->timeout(60)->get($url);
            if (! $response->successful()) {
                $this->bgLog('Replicate storeResultFromUrl failed', ['status_code' => $response->status()]);
                return null;
            }
            $imageData = $response->body();
            $filename = 'remove_bg_' . Str::random(16) . '_' . time() . '.png';
            $path = 'ai-studio/' . $filename;
            Storage::disk('public')->put($path, $imageData);
            $this->bgLog('Replicate storeResultFromUrl stored', ['path' => $path, 'size' => strlen($imageData)]);
            return $path;
        } catch (\Throwable $e) {
            $this->bgLog('Replicate storeResultFromUrl error', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }
}
