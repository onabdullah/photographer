<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\Admin\AiModelVisibilityMail;
use App\Models\AiStudioToolSetting;
use App\Models\AppStat;
use App\Models\ImageGeneration;
use App\Models\NanoBananaSetting;
use App\Models\SiteSetting;
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
        if (! in_array($tab, ['overview', 'models', 'nano-banana'], true)) {
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

    /**
     * Get current Nano Banana 2 configuration.
     * Requires ai.tools.manage permission.
     */
    public function getNanoBananaSettings(Request $request)
    {
        $admin = $request->user('admin');
        if (!$admin || !$admin->can('ai.tools.manage')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $settings = SiteSetting::getNanoBananaSettings();
        $configDefaults = config('ai_studio_tools.nano_banana', []);

        return response()->json([
            'settings' => $settings,
            'supported_fields' => $configDefaults['supported_fields'] ?? [],
            'presets' => $configDefaults['presets'] ?? [],
            'cost_per_resolution' => $configDefaults['cost_per_resolution'] ?? [],
            'features' => $configDefaults['features'] ?? [],
        ]);
    }

    /**
     * Update Nano Banana 2 configuration.
     * Requires ai.tools.manage permission.
     */
    public function updateNanoBananaSettings(Request $request)
    {
        $admin = $request->user('admin');
        if (!$admin || !$admin->can('ai.tools.manage')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'model_version' => 'nullable|string|max:255',
            'default_resolution' => 'nullable|string|in:1K,2K,4K',
            'default_aspect_ratio' => 'nullable|string|in:match_input_image,1:1,1:4,1:8,2:3,3:2,3:4,4:1,4:3,4:5,5:4,8:1,9:16,16:9,21:9',
            'default_output_format' => 'nullable|string|in:jpg,png',
            'prompt_template' => 'nullable|string|max:2000',
            'current_preset' => 'nullable|string|in:balanced,quality,fast',
            'advanced_config' => 'nullable|array',
            'features_enabled' => 'nullable|array',
            'cost_guardrails' => 'nullable|array',
        ]);

        $before = SiteSetting::getNanoBananaSettings();

        // Update via SiteSetting (which caches properly)
        SiteSetting::setNanoBananaSettings($validated);
        $after = SiteSetting::getNanoBananaSettings();

        // Log the change for audit trail
        activity()
            ->causedBy($admin)
            ->withProperties([
                'updated_fields' => array_keys($validated),
                'before' => $before,
                'after' => $after,
            ])
            ->log('Updated Nano Banana 2 settings');

        return response()->json([
            'message' => 'Nano Banana settings updated successfully',
            'settings' => SiteSetting::getNanoBananaSettings(),
        ]);
    }

    /**
     * Apply a preset configuration for Nano Banana 2.
     * Requires ai.tools.manage permission.
     */
    public function applyNanoBananaPreset(Request $request)
    {
        $admin = $request->user('admin');
        if (!$admin || !$admin->can('ai.tools.manage')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'preset_name' => 'required|string|in:balanced,quality,fast',
        ]);

        $presetName = $validated['preset_name'];
        $preset = SiteSetting::getNanoBananaPreset($presetName);

        if (!$preset) {
            return response()->json(['message' => 'Preset not found'], 404);
        }

        // Apply preset values
        SiteSetting::setNanoBananaSettings([
            'current_preset' => $presetName,
            'default_resolution' => $preset['resolution'] ?? '1K',
            'default_output_format' => $preset['output_format'] ?? 'jpg',
            'advanced_config' => [
                'guidance_scale' => $preset['guidance_scale'] ?? 7.5,
                'num_inference_steps' => $preset['num_inference_steps'] ?? 28,
            ],
            'features_enabled' => [
                'google_search' => (bool) ($preset['google_search'] ?? false),
                'image_search' => (bool) ($preset['image_search'] ?? false),
            ],
        ]);

        activity()
            ->causedBy($admin)
            ->withProperties(['preset' => $presetName])
            ->log('Applied Nano Banana 2 preset');

        return response()->json([
            'message' => "Preset '{$presetName}' applied successfully",
            'settings' => SiteSetting::getNanoBananaSettings(),
        ]);
    }

    /**
     * Get all Nano Banana runtime states (for diagnostics).
     * Requires ai.tools.manage permission.
     */
    public function getNanoBananaStatus(Request $request)
    {
        $admin = $request->user('admin');
        if (!$admin || !$admin->can('ai.tools.manage')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $configDefaults = config('ai_studio_tools.nano_banana', []);
        $settings = SiteSetting::getNanoBananaSettings();

        return response()->json([
            'status' => 'configured',
            'model_version' => $settings['model_version'],
            'defaults' => [
                'resolution' => $settings['default_resolution'],
                'format' => $settings['default_output_format'],
                'aspect_ratio' => $settings['default_aspect_ratio'],
            ],
            'features' => $settings['features_enabled'],
            'presets' => $configDefaults['presets'] ?? [],
            'retry_config' => $configDefaults['retry'] ?? [],
            'cost_multipliers' => $configDefaults['cost_per_resolution'] ?? [],
        ]);
    }
}
