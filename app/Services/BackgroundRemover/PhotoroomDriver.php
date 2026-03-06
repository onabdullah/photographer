<?php

namespace App\Services\BackgroundRemover;

use App\Contracts\BackgroundRemoverInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PhotoroomDriver implements BackgroundRemoverInterface
{
    private const SEGMENT_URL = 'https://sdk.photoroom.com/v1/segment';

    private function bgLog(string $message, array $context = []): void
    {
        Log::channel('bg_remover')->info($message, array_merge(['driver' => 'PhotoroomDriver'], $context));
    }

    /**
     * Photoroom is synchronous: send image URL, get back result image. No job_id.
     */
    public function processImage(string $imageUrl): array
    {
        $key = config('services.photoroom.key');
        if (empty($key)) {
            throw new \RuntimeException('Photoroom API key is not configured.');
        }

        $this->bgLog('Photoroom processImage API request', [
            'url' => self::SEGMENT_URL,
            'image_url' => $imageUrl,
        ]);

        $imageData = Http::timeout(30)->get($imageUrl)->body();
        if (empty($imageData)) {
            throw new \RuntimeException('Could not fetch image from URL.');
        }
        $inputSize = strlen($imageData);
        $this->bgLog('Photoroom fetched source image', ['size_bytes' => $inputSize]);

        $response = Http::withHeaders([
            'x-api-key' => $key,
        ])
            ->attach('image_file', $imageData, 'image.jpg')
            ->timeout(60)
            ->post(self::SEGMENT_URL);

        $statusCode = $response->status();
        $responseSize = strlen($response->body());
        $this->bgLog('Photoroom processImage API response', [
            'status_code' => $statusCode,
            'response_body_size' => $responseSize,
        ]);

        if (! $response->successful()) {
            $body = $response->json();
            $message = $body['message'] ?? $body['error'] ?? $response->body();
            $this->bgLog('Photoroom processImage API error', [
                'status_code' => $statusCode,
                'response' => is_array($body) ? $body : ['raw' => $response->body()],
            ]);
            if ($statusCode === 503 || $statusCode === 502 || $statusCode === 504) {
                throw new \RuntimeException('Background removal service is temporarily unavailable. Please try again in a moment.');
            }
            throw new \RuntimeException('Photoroom API failed: ' . (is_string($message) ? $message : json_encode($message)));
        }

        $resultPath = $this->storeResult($response->body());
        $resultUrl = Storage::disk('public')->url($resultPath);
        $this->bgLog('Photoroom processImage stored result', ['path' => $resultPath, 'result_url' => $resultUrl]);

        return [
            'status' => 'completed',
            'job_id' => null,
            'result_url' => $resultUrl,
        ];
    }

    /**
     * No async jobs; Photoroom returns immediately. This is only for interface compliance.
     */
    public function checkJobStatus(string $jobId): array
    {
        $this->bgLog('Photoroom checkJobStatus (no-op)', ['job_id' => $jobId]);
        return [
            'status' => 'completed',
            'job_id' => $jobId,
            'result_url' => null,
        ];
    }

    private function storeResult(string $imageData): string
    {
        $filename = 'remove_bg_photoroom_' . Str::random(16) . '_' . time() . '.png';
        $path = 'ai-studio/' . $filename;
        Storage::disk('public')->put($path, $imageData);
        return $path;
    }
}
