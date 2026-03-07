<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppStat;
use App\Models\ImageGeneration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AiStudioToolsController extends Controller
{
    /** Map tool_used to AppStat key prefix (e.g. background_remover -> bg_remover). */
    private const APP_STAT_PREFIX = [
        'background_remover' => 'bg_remover',
        'magic_eraser' => 'magic_eraser',
        'compressor' => 'compressor',
        'upscaler' => 'upscaler',
        'enhance' => 'enhance',
        'lighting' => 'lighting',
    ];

    public function __invoke(Request $request)
    {
        $toolsConfig = config('ai_studio_tools.tools', []);
        $toolOrder = config('ai_studio_tools.tool_order', array_keys($toolsConfig));

        $appStats = AppStat::whereIn('key', [
            'total_api_requests',
            'bg_remover_success_count', 'bg_remover_failed_count',
            'magic_eraser_success_count', 'magic_eraser_failed_count',
            'compressor_success_count', 'compressor_failed_count',
            'upscaler_success_count', 'upscaler_failed_count',
            'enhance_success_count', 'enhance_failed_count',
            'lighting_success_count', 'lighting_failed_count',
        ])->pluck('value', 'key')->toArray();

        $totalsByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as total')
            ->where('status', 'completed')
            ->whereNotNull('result_image_url')
            ->groupBy('tool_used')
            ->pluck('total', 'tool_used')
            ->toArray();

        $usedInProductionByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as used')
            ->whereNotNull('shopify_product_id')
            ->groupBy('tool_used')
            ->pluck('used', 'tool_used')
            ->toArray();

        $tools = [];
        foreach ($toolOrder as $toolKey) {
            $meta = $toolsConfig[$toolKey] ?? ['label' => $toolKey, 'model_name' => '—', 'model_provider' => '—'];
            $prefix = self::APP_STAT_PREFIX[$toolKey] ?? $toolKey;
            $tools[] = [
                'key' => $toolKey,
                'label' => $meta['label'],
                'model_name' => $meta['model_name'],
                'model_provider' => $meta['model_provider'],
                'total_completed' => (int) ($totalsByTool[$toolKey] ?? 0),
                'success_count' => (int) ($appStats[$prefix . '_success_count'] ?? 0),
                'failed_count' => (int) ($appStats[$prefix . '_failed_count'] ?? 0),
                'used_in_production' => (int) ($usedInProductionByTool[$toolKey] ?? 0),
            ];
        }

        $chartDays = 30;
        $snapshots = DB::table('ai_studio_daily_snapshots')
            ->where('date', '>=', now()->subDays($chartDays)->format('Y-m-d'))
            ->orderBy('date')
            ->get();

        $chartData = $snapshots->map(fn ($row) => [
            'date' => $row->date,
            'tool_used' => $row->tool_used,
            'total_completed' => (int) $row->total_completed,
            'total_failed' => (int) $row->total_failed,
            'used_in_production' => (int) $row->used_in_production,
        ])->toArray();

        $recentGenerations = ImageGeneration::query()
            ->whereNotNull('result_image_url')
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get(['id', 'shop_domain', 'tool_used', 'result_image_url', 'shopify_product_id', 'created_at', 'updated_at'])
            ->map(function ($gen) {
                $arr = $gen->toArray();
                $arr['has_product'] = ! empty($gen->shopify_product_id);
                return $arr;
            })
            ->toArray();

        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        foreach ($recentGenerations as &$gen) {
            if (! empty($gen['result_image_url']) && str_starts_with($gen['result_image_url'], '/')) {
                $gen['result_image_url'] = $baseUrl . $gen['result_image_url'];
            }
        }

        return Inertia::render('Admin/Pages/AIStudioTools/Index', [
            'tools' => $tools,
            'chartData' => $chartData,
            'recentGenerations' => $recentGenerations,
            'totalApiRequests' => (int) ($appStats['total_api_requests'] ?? 0),
        ]);
    }
}
