<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    use GetsCurrentShop;

    /** Default app settings (keys must match frontend). */
    private static function defaultAppSettings(): array
    {
        return [
            'defaultFormat' => 'webp',
            'defaultAspectRatio' => 'original',
            'defaultResolution' => 'original',
            'saveToShopify' => ['add_secondary'],
            'autoTagProducts' => true,
            'generationMode' => 'balanced',
            'defaultCreativity' => 'balanced',
            'defaultBackgroundStyle' => 'clean_studio',
            'autoEnhanceFaces' => false,
            'autoBackgroundCleanup' => true,
            'autoPublishToProduct' => false,
            'notifyLowCredits' => true,
            'lowCreditThreshold' => 50,
            'digestFrequency' => 'weekly',
            'businessGoal' => 'conversion',
            'autoDeleteGeneratedImagesAfterDays' => 30,
            'watermarkPreviewImages' => false,
        ];
    }

    /**
     * Keys managed by the merchant settings page.
     *
     * We update only these keys to avoid clobbering unrelated data inside
     * app_settings (eg: credit wallet internals and threshold notifier state).
     *
     * @return array<int, string>
     */
    private static function managedSettingsKeys(): array
    {
        return array_keys(self::defaultAppSettings());
    }

    public function settings(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $stored = is_array($shop->app_settings) ? $shop->app_settings : [];
        $storedUiSettings = array_intersect_key($stored, array_flip(self::managedSettingsKeys()));

        // Migrate old field names to new ones for backwards compatibility
        if (isset($storedUiSettings['weeklyPerformanceDigest']) && isset($storedUiSettings['usageDigestFrequency'])) {
            if ($storedUiSettings['weeklyPerformanceDigest'] === false) {
                $storedUiSettings['digestFrequency'] = 'off';
            } else {
                $storedUiSettings['digestFrequency'] = $storedUiSettings['usageDigestFrequency'];
            }
            unset($storedUiSettings['weeklyPerformanceDigest'], $storedUiSettings['usageDigestFrequency']);
        }
        if (isset($storedUiSettings['assetRetentionDays'])) {
            $storedUiSettings['autoDeleteGeneratedImagesAfterDays'] = $storedUiSettings['assetRetentionDays'];
            unset($storedUiSettings['assetRetentionDays']);
        }
        if (isset($storedUiSettings['autoUpscale'])) {
            unset($storedUiSettings['autoUpscale']);
        }

        $initialSettings = array_merge(self::defaultAppSettings(), $storedUiSettings);
        if (! isset($initialSettings['saveToShopify']) || ! is_array($initialSettings['saveToShopify'])) {
            $initialSettings['saveToShopify'] = self::defaultAppSettings()['saveToShopify'];
        }
        if (! isset($initialSettings['defaultResolution']) || ! in_array($initialSettings['defaultResolution'], ['original', '2k'], true)) {
            $initialSettings['defaultResolution'] = 'original';
        }
        if (! isset($initialSettings['defaultAspectRatio']) || ! in_array($initialSettings['defaultAspectRatio'], ['original', '1:1', '4:5', '16:9'], true)) {
            $initialSettings['defaultAspectRatio'] = 'original';
        }
        if (! in_array((string) $initialSettings['generationMode'], ['balanced', 'speed', 'quality'], true)) {
            $initialSettings['generationMode'] = 'balanced';
        }
        if (! in_array((string) $initialSettings['defaultCreativity'], ['safe', 'balanced', 'bold'], true)) {
            $initialSettings['defaultCreativity'] = 'balanced';
        }
        if (! in_array((string) $initialSettings['defaultBackgroundStyle'], ['clean_studio', 'lifestyle', 'transparent', 'contextual'], true)) {
            $initialSettings['defaultBackgroundStyle'] = 'clean_studio';
        }
        if (! in_array((string) $initialSettings['digestFrequency'], ['off', 'daily', 'weekly', 'monthly'], true)) {
            $initialSettings['digestFrequency'] = 'weekly';
        }
        if (! in_array((string) $initialSettings['businessGoal'], ['conversion', 'catalog_velocity', 'brand_consistency'], true)) {
            $initialSettings['businessGoal'] = 'conversion';
        }
        $initialSettings['lowCreditThreshold'] = max(5, min(1000, (int) ($initialSettings['lowCreditThreshold'] ?? 50)));
        $initialSettings['autoDeleteGeneratedImagesAfterDays'] = max(7, min(365, (int) ($initialSettings['autoDeleteGeneratedImagesAfterDays'] ?? 30)));

        return \Inertia\Inertia::render('Shopify/Settings', [
            'initialSettings' => $initialSettings,
            'storeProfile' => [
                'storeName' => $shop->store_name ?: $shop->name,
                'domain' => $shop->name,
                'email' => $shop->email,
                'owner' => $shop->shop_owner,
                'country' => $shop->country,
                'installedAt' => optional($shop->created_at)?->toDateString(),
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $request->validate([
            'defaultFormat' => 'required|string|in:webp,png,jpg',
            'defaultAspectRatio' => 'required|string|in:original,1:1,4:5,16:9',
            'defaultResolution' => 'nullable|string|in:original,2k',
            'autoUpscale' => 'boolean',
            'saveToShopify' => 'required|array',
            'saveToShopify.*' => 'string|in:add_secondary,replace_primary',
            'autoTagProducts' => 'boolean',
            'generationMode' => 'required|string|in:balanced,speed,quality',
            'defaultCreativity' => 'required|string|in:safe,balanced,bold',
            'defaultBackgroundStyle' => 'required|string|in:clean_studio,lifestyle,transparent,contextual',
            'autoEnhanceFaces' => 'boolean',
            'autoBackgroundCleanup' => 'boolean',
            'autoPublishToProduct' => 'boolean',
            'notifyLowCredits' => 'boolean',
            'lowCreditThreshold' => 'required|integer|min:5|max:1000',
            'digestFrequency' => 'required|string|in:off,daily,weekly,monthly',
            'businessGoal' => 'required|string|in:conversion,catalog_velocity,brand_consistency',
            'autoDeleteGeneratedImagesAfterDays' => 'required|integer|min:7|max:365',
            'watermarkPreviewImages' => 'boolean',
        ]);

        $resolution = $request->input('defaultResolution', 'original');
        $autoUpscale = (bool) $request->input('autoUpscale', $resolution === '2k');

        $existingSettings = is_array($shop->app_settings) ? $shop->app_settings : [];

        $updatedUiSettings = [
            'defaultFormat' => $request->input('defaultFormat'),
            'defaultAspectRatio' => $request->input('defaultAspectRatio'),
            'defaultResolution' => $resolution === '2k' ? '2k' : 'original',
            'saveToShopify' => $request->input('saveToShopify'),
            'autoTagProducts' => (bool) $request->input('autoTagProducts', false),
            'generationMode' => $request->input('generationMode', 'balanced'),
            'defaultCreativity' => $request->input('defaultCreativity', 'balanced'),
            'defaultBackgroundStyle' => $request->input('defaultBackgroundStyle', 'clean_studio'),
            'autoEnhanceFaces' => (bool) $request->input('autoEnhanceFaces', false),
            'autoBackgroundCleanup' => (bool) $request->input('autoBackgroundCleanup', true),
            'autoPublishToProduct' => (bool) $request->input('autoPublishToProduct', false),
            'notifyLowCredits' => (bool) $request->input('notifyLowCredits', true),
            'lowCreditThreshold' => max(5, min(1000, (int) $request->input('lowCreditThreshold', 50))),
            'digestFrequency' => $request->input('digestFrequency', 'weekly'),
            'businessGoal' => $request->input('businessGoal', 'conversion'),
            'autoDeleteGeneratedImagesAfterDays' => max(7, min(365, (int) $request->input('autoDeleteGeneratedImagesAfterDays', 30))),
            'watermarkPreviewImages' => (bool) $request->input('watermarkPreviewImages', false),
        ];

        $shop->app_settings = array_merge($existingSettings, $updatedUiSettings);
        $shop->save();

        return redirect()->route('shopify.settings')->with('success', 'Settings saved.');
    }

    public function clearHistory(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $generations = ImageGeneration::where('shop_domain', $shop->name)->get();

        $deletedFiles = 0;
        foreach ($generations as $generation) {
            foreach (['original_image_url', 'result_image_url'] as $key) {
                $url = (string) ($generation->{$key} ?? '');
                if ($url === '') {
                    continue;
                }

                $path = parse_url($url, PHP_URL_PATH);
                if (! is_string($path) || ! str_starts_with($path, '/storage/')) {
                    continue;
                }

                $relative = ltrim(substr($path, strlen('/storage/')), '/');
                if ($relative === '') {
                    continue;
                }

                if (Storage::disk('public')->exists($relative)) {
                    Storage::disk('public')->delete($relative);
                    $deletedFiles++;
                }
            }
        }

        $deletedRows = ImageGeneration::where('shop_domain', $shop->name)->delete();

        Log::info('[SettingsController] Generation history cleared', [
            'shop' => $shop->name,
            'deleted_rows' => $deletedRows,
            'deleted_files' => $deletedFiles,
        ]);

        return redirect()->route('shopify.settings')->with('success', 'Generation history cleared successfully.');
    }
}
