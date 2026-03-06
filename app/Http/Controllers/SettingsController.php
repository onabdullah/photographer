<?php

namespace App\Http\Controllers;

use App\Http\Traits\GetsCurrentShop;
use Illuminate\Http\Request;

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
            'autoUpscale' => false,
            'saveToShopify' => ['add_secondary'],
            'autoTagProducts' => true,
        ];
    }

    public function settings(Request $request)
    {
        $shop = $this->currentShop($request);
        if (! $shop) {
            abort(403, 'Shop not authenticated');
        }

        $stored = $shop->app_settings ?? [];
        $initialSettings = array_merge(self::defaultAppSettings(), $stored);
        if (! isset($initialSettings['saveToShopify']) || ! is_array($initialSettings['saveToShopify'])) {
            $initialSettings['saveToShopify'] = self::defaultAppSettings()['saveToShopify'];
        }
        if (! isset($initialSettings['defaultResolution']) || ! in_array($initialSettings['defaultResolution'], ['original', '2k'], true)) {
            $initialSettings['defaultResolution'] = ! empty($initialSettings['autoUpscale']) ? '2k' : 'original';
        }
        if (! isset($initialSettings['defaultAspectRatio']) || ! in_array($initialSettings['defaultAspectRatio'], ['original', '1:1', '4:5', '16:9'], true)) {
            $initialSettings['defaultAspectRatio'] = 'original';
        }

        return \Inertia\Inertia::render('Shopify/Settings', [
            'initialSettings' => $initialSettings,
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
        ]);

        $resolution = $request->input('defaultResolution', 'original');
        $autoUpscale = (bool) $request->input('autoUpscale', $resolution === '2k');

        $shop->app_settings = [
            'defaultFormat' => $request->input('defaultFormat'),
            'defaultAspectRatio' => $request->input('defaultAspectRatio'),
            'defaultResolution' => $resolution === '2k' ? '2k' : 'original',
            'autoUpscale' => $autoUpscale,
            'saveToShopify' => $request->input('saveToShopify'),
            'autoTagProducts' => (bool) $request->input('autoTagProducts', false),
        ];
        $shop->save();

        return redirect()->route('shopify.settings')->with('success', 'Settings saved.');
    }
}
