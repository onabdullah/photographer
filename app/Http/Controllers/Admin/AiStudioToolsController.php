<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Admin\AiModelVisibilityMail;
use App\Models\AiStudioToolSetting;
use App\Models\AppStat;
use App\Models\ImageGeneration;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AiStudioToolsController extends Controller
{
    /** Map tool_used to AppStat key prefix (e.g. background_remover -> bg_remover). */
    private const APP_STAT_PREFIX = [
        'universal_generate' => 'universal_generate',
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
            'universal_generate_success_count', 'universal_generate_failed_count',
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

        $failedByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as total')
            ->where('status', 'failed')
            ->groupBy('tool_used')
            ->pluck('total', 'tool_used')
            ->toArray();

        $usedInProductionByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as used')
            ->whereNotNull('shopify_product_id')
            ->groupBy('tool_used')
            ->pluck('used', 'tool_used')
            ->toArray();

        $downloadedByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as downloaded')
            ->whereNotNull('downloaded_at')
            ->groupBy('tool_used')
            ->pluck('downloaded', 'tool_used')
            ->toArray();

        // Response time stats per tool (avg, min, max, count) — only where processing_time_seconds is set
        $responseTimeByTool = ImageGeneration::query()
            ->selectRaw('tool_used, count(*) as cnt, avg(processing_time_seconds) as avg_sec, min(processing_time_seconds) as min_sec, max(processing_time_seconds) as max_sec')
            ->whereNotNull('processing_time_seconds')
            ->groupBy('tool_used')
            ->get()
            ->keyBy('tool_used')
            ->toArray();

        // Errors per tool: message + count (failed records with error_message)
        $errorsByTool = ImageGeneration::query()
            ->where('status', 'failed')
            ->whereNotNull('error_message')
            ->selectRaw('tool_used, error_message, count(*) as cnt')
            ->groupBy('tool_used', 'error_message')
            ->orderByDesc('cnt')
            ->get()
            ->groupBy('tool_used')
            ->map(fn ($rows) => $rows->map(fn ($r) => ['message' => $r->error_message, 'count' => (int) $r->cnt])->values()->all())
            ->toArray();

        try {
            $toolSettings = AiStudioToolSetting::whereIn('tool_key', $toolOrder)->pluck('is_enabled', 'tool_key')->toArray();
        } catch (\Throwable $e) {
            $toolSettings = [];
        }

        $tools = [];
        foreach ($toolOrder as $toolKey) {
            $meta = $toolsConfig[$toolKey] ?? ['label' => $toolKey, 'model_name' => '—', 'model_provider' => '—'];
            $prefix = self::APP_STAT_PREFIX[$toolKey] ?? $toolKey;
            // Use ImageGeneration as source of truth so Runs / Success / Failed / Consumed stay in sync
            $successFromDb = (int) ($totalsByTool[$toolKey] ?? 0);
            $failedFromDb = (int) ($failedByTool[$toolKey] ?? 0);
            $requestsCount = $successFromDb + $failedFromDb;
            $credits_used = $requestsCount;
            $rt = $responseTimeByTool[$toolKey] ?? null;
            $ratePerImageUsd = (float) ($meta['estimated_rate_per_image_usd'] ?? 0);
            $consumedUsd = round($credits_used * $ratePerImageUsd, 4);

            $tools[] = [
                'key' => $toolKey,
                'label' => $meta['label'],
                'model_name' => $meta['model_name'],
                'model_provider' => $meta['model_provider'],
                'estimated_rate_per_image_usd' => $ratePerImageUsd,
                'consumed_usd' => $consumedUsd,
                'is_enabled' => $toolSettings[$toolKey] ?? true,
                'total_completed' => $successFromDb,
                'success_count' => $successFromDb,
                'failed_count' => $failedFromDb,
                'used_in_production' => (int) ($usedInProductionByTool[$toolKey] ?? 0),
                'downloaded_count' => (int) ($downloadedByTool[$toolKey] ?? 0),
                'credits_used' => $credits_used,
                'requests_count' => $requestsCount,
                'avg_response_seconds' => $rt ? round((float) $rt['avg_sec'], 2) : null,
                'min_response_seconds' => $rt ? round((float) $rt['min_sec'], 2) : null,
                'max_response_seconds' => $rt ? round((float) $rt['max_sec'], 2) : null,
                'response_time_count' => $rt ? (int) $rt['cnt'] : 0,
                'errors' => $errorsByTool[$toolKey] ?? [],
            ];
        }

        // Most used tool (by total completed)
        $mostUsed = collect($tools)->sortByDesc('total_completed')->first();
        $mostUsedToolKey = $mostUsed && ($mostUsed['total_completed'] ?? 0) > 0 ? $mostUsed['key'] : null;
        $mostUsedToolLabel = $mostUsed && ($mostUsed['total_completed'] ?? 0) > 0 ? $mostUsed['label'] : null;

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
            ->limit(50)
            ->get(['id', 'shop_domain', 'tool_used', 'result_image_url', 'shopify_product_id', 'downloaded_at', 'created_at', 'updated_at'])
            ->map(function ($gen) {
                $arr = $gen->toArray();
                $arr['has_product'] = ! empty($gen->shopify_product_id);
                $arr['has_downloaded'] = ! empty($gen->downloaded_at);
                return $arr;
            })
            ->toArray();

        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        foreach ($recentGenerations as &$gen) {
            if (! empty($gen['result_image_url']) && str_starts_with($gen['result_image_url'], '/')) {
                $gen['result_image_url'] = $baseUrl . $gen['result_image_url'];
            }
        }

        $tab = $request->input('tab', 'overview');
        if (! in_array($tab, ['overview', 'models'], true)) {
            $tab = 'overview';
        }

        return Inertia::render('Admin/Pages/AIStudioTools/Index', [
            'tools' => $tools,
            'chartData' => $chartData,
            'recentGenerations' => $recentGenerations,
            'totalApiRequests' => (int) ($appStats['total_api_requests'] ?? 0),
            'mostUsedToolKey' => $mostUsedToolKey,
            'mostUsedToolLabel' => $mostUsedToolLabel,
            'initialTab' => $tab,
        ]);
    }

    public function updateToolSetting(Request $request)
    {
        $request->validate([
            'tool_key'   => 'required|string|in:universal_generate,magic_eraser,background_remover,compressor,upscaler,enhance,lighting',
            'is_enabled' => 'required|boolean',
        ]);

        $toolKey   = $request->input('tool_key');
        $isEnabled = $request->boolean('is_enabled');

        AiStudioToolSetting::updateOrCreate(
            ['tool_key' => $toolKey],
            ['is_enabled' => $isEnabled]
        );

        $admin = $request->user('admin');
        if ($admin) {
            $smtp = MailService::resolveSmtp();
            if ($smtp && $admin->email) {
                $label   = AiModelVisibilityMail::TOOL_LABELS[$toolKey] ?? $toolKey;
                $subject = $label . ' ' . ($isEnabled ? 'Shown on Store' : 'Hidden from Store') . ' — ' . config('app.name');
                MailService::queue($admin->email, new AiModelVisibilityMail(
                    user: $admin,
                    fromAddress: $smtp->from_address,
                    fromName: $smtp->from_name,
                    toolKey: $toolKey,
                    visible: $isEnabled,
                    ip: $request->ip(),
                    userAgent: $request->userAgent() ?? 'Unknown',
                ), $subject);
            }
        }

        return redirect()->back()->with('success', 'Tool setting updated.');
    }
}
