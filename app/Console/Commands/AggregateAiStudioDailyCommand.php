<?php

namespace App\Console\Commands;

use App\Models\ImageGeneration;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AggregateAiStudioDailyCommand extends Command
{
    protected $signature = 'ai-studio:aggregate-daily
                            {--days=30 : Number of past days to aggregate (default 30)}
                            {--backfill : Include today and yesterday for initial backfill}';

    protected $description = 'Aggregate AI Studio usage into ai_studio_daily_snapshots for charts and reports.';

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $backfill = $this->option('backfill');
        $toolOrder = config('ai_studio_tools.tool_order', [
            'magic_eraser', 'background_remover', 'compressor', 'upscaler', 'enhance', 'lighting',
        ]);

        $end = $backfill ? now() : now()->subDay();
        $start = now()->subDays($days);
        $dates = [];
        for ($d = $start->copy(); $d->lte($end); $d->addDay()) {
            $dates[] = $d->format('Y-m-d');
        }

        $this->info('Aggregating ' . count($dates) . ' days for ' . count($toolOrder) . ' tools.');

        foreach ($dates as $date) {
            foreach ($toolOrder as $toolUsed) {
                $completed = ImageGeneration::where('tool_used', $toolUsed)
                    ->whereDate('created_at', $date)
                    ->where('status', 'completed')
                    ->whereNotNull('result_image_url')
                    ->count();

                $failed = ImageGeneration::where('tool_used', $toolUsed)
                    ->whereDate('created_at', $date)
                    ->where('status', 'failed')
                    ->count();

                $usedInProduction = ImageGeneration::where('tool_used', $toolUsed)
                    ->whereDate('created_at', $date)
                    ->whereNotNull('shopify_product_id')
                    ->count();

                DB::table('ai_studio_daily_snapshots')->upsert(
                    [
                        'date' => $date,
                        'tool_used' => $toolUsed,
                        'total_completed' => $completed,
                        'total_failed' => $failed,
                        'used_in_production' => $usedInProduction,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ],
                    ['date', 'tool_used'],
                    ['total_completed', 'total_failed', 'used_in_production', 'updated_at']
                );
            }
        }

        $this->info('Done.');
        return self::SUCCESS;
    }
}
