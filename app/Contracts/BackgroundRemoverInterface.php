<?php

namespace App\Contracts;

interface BackgroundRemoverInterface
{
    /**
     * Process an image for background removal.
     *
     * @param  string  $imageUrl  Publicly accessible URL of the image
     * @return array{status: 'processing'|'completed', job_id: string|null, result_url: string|null}
     */
    public function processImage(string $imageUrl): array;

    /**
     * Check the status of an async background-removal job.
     *
     * @param  string  $jobId  The job/prediction ID returned by processImage
     * @return array{status: 'processing'|'completed', job_id: string|null, result_url: string|null}
     */
    public function checkJobStatus(string $jobId): array;
}
