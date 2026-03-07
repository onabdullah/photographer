<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Professional image compression built in Laravel using PHP GD.
 * Reduces file size by re-encoding with configurable quality. Original dimensions and
 * aspect ratio are preserved unless max_width/max_height are set (resize is proportional).
 * JPEG output uses white background for transparent areas; PNG preserves transparency.
 */
class ImageCompressorService
{
    private const DEFAULT_QUALITY = 82;

    /** Max pixels per side to avoid memory exhaustion (12MP safe for GD) */
    private const MAX_DIMENSION = 4096;

    /**
     * Compress image from URL: fetch, re-encode at given quality, store, return public URL.
     *
     * @param  array{quality?: int, max_width?: int, max_height?: int, format?: 'jpeg'|'png'}  $options
     */
    public function compress(string $imageUrl, array $options = []): string
    {
        $quality = (int) ($options['quality'] ?? self::DEFAULT_QUALITY);
        $quality = max(60, min(95, $quality));
        $maxWidth = isset($options['max_width']) ? (int) $options['max_width'] : 0;
        $maxHeight = isset($options['max_height']) ? (int) $options['max_height'] : 0;
        $format = isset($options['format']) && in_array($options['format'], ['jpeg', 'png'], true)
            ? $options['format'] : 'jpeg';

        $binary = $this->fetchImageContent($imageUrl);
        if ($binary === null || $binary === '') {
            throw new \RuntimeException('Could not load image. Check the URL or file and try again.');
        }

        $image = @imagecreatefromstring($binary);
        if ($image === false) {
            throw new \RuntimeException('Unsupported or corrupt image. Use JPEG, PNG, GIF, or WebP.');
        }

        try {
            $width = imagesx($image);
            $height = imagesy($image);
            if ($width <= 0 || $height <= 0) {
                throw new \RuntimeException('Invalid image dimensions.');
            }
            if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
                $scale = min(self::MAX_DIMENSION / $width, self::MAX_DIMENSION / $height);
                $newW = (int) round($width * $scale);
                $newH = (int) round($height * $scale);
                $image = $this->resizeProportional($image, $width, $height, $newW, $newH) ?? $image;
            }

            // Optional explicit resize: preserve aspect ratio (use current dimensions after any scale-down)
            $currentW = imagesx($image);
            $currentH = imagesy($image);
            if ($maxWidth > 0 && $maxHeight > 0 && ($currentW > $maxWidth || $currentH > $maxHeight)) {
                $image = $this->resizeProportional($image, $currentW, $currentH, $maxWidth, $maxHeight);
                if ($image === null) {
                    throw new \RuntimeException('Resize failed.');
                }
            }

            $path = $this->saveCompressed($image, $format, $quality);
            return $this->toPublicUrl($path);
        } finally {
            if (is_resource($image) || $image instanceof \GdImage) {
                @imagedestroy($image);
            }
        }
    }

    private function fetchImageContent(string $imageUrl): ?string
    {
        $appUrl = rtrim(config('app.url'), '/');
        if ($appUrl !== '' && str_starts_with($imageUrl, $appUrl . '/')) {
            $path = parse_url($imageUrl, PHP_URL_PATH);
            if ($path && str_starts_with($path, '/storage/')) {
                $storagePath = substr($path, strlen('/storage/'));
                $full = Storage::disk('public')->path($storagePath);
                if (file_exists($full) && is_readable($full)) {
                    $content = file_get_contents($full);
                    return $content !== false ? $content : null;
                }
            }
        }

        $response = Http::timeout(30)->get($imageUrl);
        if (! $response->successful()) {
            return null;
        }
        return $response->body();
    }

    /**
     * Resize image proportionally to fit within max dimensions. Returns new resource or null.
     */
    private function resizeProportional(\GdImage $image, int $width, int $height, int $maxWidth, int $maxHeight): ?\GdImage
    {
        $ratio = min($maxWidth / $width, $maxHeight / $height, 1.0);
        if ($ratio >= 1.0) {
            return $image;
        }
        $newWidth = (int) round($width * $ratio);
        $newHeight = (int) round($height * $ratio);
        if ($newWidth < 1 || $newHeight < 1) {
            return $image;
        }
        $new = imagecreatetruecolor($newWidth, $newHeight);
        if ($new === false) {
            return null;
        }
        if (! imagecopyresampled($new, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height)) {
            imagedestroy($new);
            return null;
        }
        imagedestroy($image);
        return $new;
    }

    private function saveCompressed(\GdImage $image, string $format, int $quality): string
    {
        $ext = $format === 'png' ? 'png' : 'jpg';
        $path = 'ai-studio/compressor_' . Str::random(16) . '_' . time() . '.' . $ext;
        $fullPath = Storage::disk('public')->path($path);

        $dir = dirname($fullPath);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        if ($format === 'png') {
            $level = (int) round(9 - (($quality / 100) * 9));
            $level = max(0, min(9, $level));
            imagepng($image, $fullPath, $level);
        } else {
            // JPEG does not support transparency: composite onto white for professional result
            $forJpeg = $this->compositeOnWhite($image);
            if ($forJpeg !== null) {
                imagejpeg($forJpeg, $fullPath, $quality);
                imagedestroy($forJpeg);
            } else {
                imagejpeg($image, $fullPath, $quality);
            }
        }

        return $path;
    }

    /**
     * Composite image onto white background so transparent areas (e.g. PNG) become white in JPEG.
     */
    private function compositeOnWhite(\GdImage $image): ?\GdImage
    {
        $w = imagesx($image);
        $h = imagesy($image);
        $out = @imagecreatetruecolor($w, $h);
        if ($out === false) {
            return null;
        }
        $white = imagecolorallocate($out, 255, 255, 255);
        imagefill($out, 0, 0, $white);
        imagecopy($out, $image, 0, 0, 0, 0, $w, $h);
        return $out;
    }

    private function toPublicUrl(string $path): string
    {
        $url = Storage::disk('public')->url($path);
        if (str_starts_with($url, '/')) {
            $url = rtrim(config('app.url'), '/') . $url;
        }
        return $url;
    }
}
