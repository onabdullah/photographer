<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DashboardMediaController extends Controller
{
    /**
     * Upload hero image.
     */
    public function uploadHeroImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,webp|max:2048',
        ]);

        try {
            $file = $request->file('image');
            $filename = 'hero-image-' . Str::random(16) . '.' . $file->getClientOriginalExtension();
            $path = 'dashboard/' . $filename;

            // Store the file
            Storage::disk('public')->put($path, file_get_contents($file));

            return response()->json([
                'url' => Storage::disk('public')->url($path),
                'path' => $path,
                'size' => Storage::disk('public')->size($path),
            ]);
        } catch (\Exception $e) {
            \Log::error('Hero image upload failed', ['error' => $e->getMessage()]);

            return response()->json(
                ['error' => 'Failed to upload image.'],
                500
            );
        }
    }

    /**
     * Delete hero image (optional).
     */
    public function deleteHeroImage(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        try {
            if (Storage::disk('public')->exists($request->path)) {
                Storage::disk('public')->delete($request->path);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Log::error('Hero image delete failed', ['error' => $e->getMessage()]);

            return response()->json(
                ['error' => 'Failed to delete image.'],
                500
            );
        }
    }
}
