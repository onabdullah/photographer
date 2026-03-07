<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AIProcessingController extends Controller
{
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

        $perPage = (int) $request->input('per_page', 48);
        $perPage = min(max($perPage, 12), 120);
        $toolFilter = $request->input('tool', 'all');
        if ($toolFilter !== 'all' && ! in_array($toolFilter, $toolOrder, true)) {
            $toolFilter = 'all';
        }

        $query = ImageGeneration::query()
            ->whereNotNull('result_image_url')
            ->orderByDesc('updated_at');

        if ($toolFilter !== 'all') {
            $query->where('tool_used', $toolFilter);
        }

        $generations = $query->paginate($perPage, ['id', 'shop_domain', 'tool_used', 'result_image_url', 'shopify_product_id', 'downloaded_at', 'created_at', 'updated_at']);

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

        return Inertia::render('Admin/Pages/AIProcessing/Index', [
            'categories' => $categories,
            'masterpieces' => $generations,
            'toolFilter' => $toolFilter,
        ]);
    }
}
