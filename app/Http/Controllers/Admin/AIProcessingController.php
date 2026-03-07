<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AIProcessingController extends Controller
{
    private const FILE_TYPES = [
        'png'  => 'PNG',
        'jpg'  => 'JPEG',
        'jpeg' => 'JPEG',
        'webp' => 'WebP',
        'gif'  => 'GIF',
    ];

    public function index(Request $request)
    {
        $toolOrder = config('ai_studio_tools.tool_order', []);
        $toolsConfig = config('ai_studio_tools.tools', []);
        $categories = [];
        $categories[] = ['key' => 'all', 'label' => 'All'];
        foreach ($toolOrder as $key) {
            $label = $toolsConfig[$key]['label'] ?? $key;
            $categories[] = ['key' => $key, 'label' => $label];
        }

        $stores = ImageGeneration::query()
            ->whereNotNull('result_image_url')
            ->select('shop_domain')
            ->distinct()
            ->orderBy('shop_domain')
            ->limit(500)
            ->pluck('shop_domain')
            ->values()
            ->toArray();

        $perPage = (int) $request->input('per_page', 48);
        $perPage = min(max($perPage, 12), 120);
        $toolFilter = $request->input('tool', 'all');
        if ($toolFilter !== 'all' && ! in_array($toolFilter, $toolOrder, true)) {
            $toolFilter = 'all';
        }
        $storeFilter = $request->input('store', '');
        $typeFilter = $request->input('type', 'all');
        $dateFrom = $request->input('date_from', '');
        $dateTo = $request->input('date_to', '');
        $usageFilter = $request->input('usage', 'all');

        $query = ImageGeneration::query()
            ->whereNotNull('result_image_url')
            ->orderByDesc('updated_at');

        if ($toolFilter !== 'all') {
            $query->where('tool_used', $toolFilter);
        }

        if ($storeFilter !== '') {
            $query->where('shop_domain', $storeFilter);
        }

        if ($typeFilter !== 'all' && array_key_exists($typeFilter, self::FILE_TYPES)) {
            $ext = strtolower($typeFilter);
            $exts = $ext === 'jpg' ? ['jpg', 'jpeg'] : [$ext];
            $placeholders = implode(',', array_fill(0, count($exts), '?'));
            $query->whereRaw(
                'LOWER(SUBSTRING_INDEX(SUBSTRING_INDEX(COALESCE(result_image_url, ""), "?", 1), ".", -1)) IN (' . $placeholders . ')',
                $exts
            );
        }

        if ($dateFrom !== '') {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo !== '') {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        if ($usageFilter === 'downloaded') {
            $query->whereNotNull('downloaded_at');
        } elseif ($usageFilter === 'on_product') {
            $query->whereNotNull('shopify_product_id');
        }

        $generations = $query->paginate($perPage, ['id', 'shop_domain', 'tool_used', 'result_image_url', 'shopify_product_id', 'downloaded_at', 'created_at', 'updated_at'])
            ->withQueryString();

        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        $generations->getCollection()->transform(function ($gen) use ($baseUrl) {
            $arr = $gen->toArray();
            $arr['has_product'] = ! empty($gen->shopify_product_id);
            $arr['has_downloaded'] = ! empty($gen->downloaded_at);
            if (! empty($arr['result_image_url']) && str_starts_with($arr['result_image_url'], '/')) {
                $arr['result_image_url'] = $baseUrl . $arr['result_image_url'];
            }
            return $arr;
        });

        $fileTypeOptions = [];
        $fileTypeOptions[] = ['key' => 'all', 'label' => 'All types'];
        foreach (array_unique(self::FILE_TYPES) as $ext => $label) {
            if ($ext === 'jpeg') {
                continue;
            }
            $fileTypeOptions[] = ['key' => $ext, 'label' => $label];
        }

        return Inertia::render('Admin/Pages/AIProcessing/Index', [
            'categories' => $categories,
            'stores' => $stores,
            'fileTypeOptions' => $fileTypeOptions,
            'masterpieces' => $generations,
            'filters' => [
                'tool' => $toolFilter,
                'store' => $storeFilter,
                'type' => $typeFilter,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'usage' => $usageFilter,
            ],
        ]);
    }
}
