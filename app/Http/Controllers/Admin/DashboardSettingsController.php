<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DashboardSetting;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class DashboardSettingsController extends Controller
{
    /**
     * Show dashboard settings page.
     */
    public function show(Request $request)
    {
        return Inertia::render('Admin/Pages/DashboardSettings', [
            'heroSettings' => DashboardSetting::getHeroSettings(),
            'featuredToolsSettings' => DashboardSetting::getFeaturedToolsSettings(),
            'announcementSettings' => DashboardSetting::getAnnouncementSettings(),
            'availableTools' => [
                ['key' => 'magic_eraser', 'label' => 'Magic Eraser', 'description' => 'Remove unwanted objects'],
                ['key' => 'remove_bg', 'label' => 'Background Remover', 'description' => 'Clean your image background'],
                ['key' => 'compressor', 'label' => 'Image Compressor', 'description' => 'Reduce file size, keep quality'],
                ['key' => 'upscale', 'label' => 'Upscaler', 'description' => 'Increase resolution 4×'],
                ['key' => 'enhance', 'label' => 'Image Enhancer', 'description' => 'Boost clarity & detail'],
                ['key' => 'lighting', 'label' => 'Lighting Fix', 'description' => 'Adjust exposure & balance'],
            ],
        ]);
    }

    /**
     * Update dashboard settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            // Hero Section
            'heroTitle' => 'required|string|max:255',
            'heroSubtitle' => 'required|string|max:500',
            'heroImageFile' => 'nullable|image|mimes:jpeg,png,webp|max:2048',
            'heroImageUrl' => 'nullable|string|url',

            // Featured Tools
            'featuredToolsEnabled' => 'boolean',
            'featuredTools' => 'nullable|array',
            'featuredTools.*' => 'string|in:magic_eraser,remove_bg,compressor,upscale,enhance,lighting',

            // Announcements
            'announcementEnabled' => 'boolean',
            'announcementText' => 'nullable|string|max:1000',
        ]);

        try {
            $heroImageUrl = $validated['heroImageUrl'] ?? '';

            // Handle file upload if provided
            if ($request->hasFile('heroImageFile')) {
                $file = $request->file('heroImageFile');
                $path = Storage::disk('public')->put('dashboard/hero', $file);
                if ($path) {
                    $heroImageUrl = Storage::disk('public')->url($path);
                }
            }

            // Ensure we have an image URL
            if (empty($heroImageUrl)) {
                return back()->withErrors(['error' => 'Hero image URL or file is required.'])->withInput();
            }

            // Update Hero Section
            DashboardSetting::setHeroSettings([
                'title' => $validated['heroTitle'],
                'subtitle' => $validated['heroSubtitle'],
                'imageUrl' => $heroImageUrl,
            ]);

            // Update Featured Tools
            DashboardSetting::setFeaturedToolsSettings([
                'enabled' => $validated['featuredToolsEnabled'] ?? false,
                'tools' => $validated['featuredTools'] ?? [],
            ]);

            // Update Announcements
            DashboardSetting::setAnnouncementSettings([
                'enabled' => $validated['announcementEnabled'] ?? false,
                'text' => $validated['announcementText'] ?? '',
            ]);

            return back()->with('success', 'Dashboard settings updated successfully.');
        } catch (\Exception $e) {
            \Log::error('Dashboard settings update failed', ['error' => $e->getMessage()]);

            return back()
                ->withErrors(['error' => 'Failed to update dashboard settings.'])
                ->withInput();
        }
    }

    /**
     * Reset settings to defaults.
     */
    public function reset(Request $request)
    {
        try {
            DashboardSetting::resetToDefaults();

            return back()->with('success', 'Dashboard settings reset to defaults.');
        } catch (\Exception $e) {
            \Log::error('Dashboard settings reset failed', ['error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Failed to reset dashboard settings.']);
        }
    }
}
