<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Inertia\Inertia;

class TerminalController extends Controller
{
    /**
     * Commands that are completely blocked — too dangerous or interactive.
     */
    private const BLOCKED = [
        'db:wipe',
        'down',
        'tinker',
        'serve',
        'key:generate',
        'migrate:reset',
    ];

    /**
     * Commands that require an explicit --force flag sent from the frontend.
     */
    private const NEEDS_FORCE = [
        'migrate:fresh',
        'migrate:rollback',
    ];

    public function index()
    {
        return Inertia::render('Admin/Pages/Terminal/Index', [
            'phpVersion'     => PHP_VERSION,
            'laravelVersion' => app()->version(),
            'appEnv'         => config('app.env'),
            'appName'        => config('app.name'),
        ]);
    }

    public function run(Request $request)
    {
        $raw = trim($request->input('command', ''));

        if ($raw === '') {
            return response()->json(['error' => 'Empty command.'], 422);
        }

        // ── Parse: strip "php artisan" / "artisan" prefixes ──────────────────
        $cmd = preg_replace('/^php\s+artisan\s+/i', '', $raw);
        $cmd = preg_replace('/^artisan\s+/i', '', $cmd);
        $cmd = trim($cmd);

        // ── Block shell-injection characters ─────────────────────────────────
        if (preg_match('/[|;&`<>!\\\\]/', $cmd)) {
            return response()->json([
                'output'    => "Error: command contains invalid characters.\n",
                'exit_code' => 1,
                'duration'  => 0,
            ]);
        }

        // ── Extract the base command name (first token) ──────────────────────
        $parts   = preg_split('/\s+/', $cmd, -1, PREG_SPLIT_NO_EMPTY);
        $baseName = $parts[0] ?? '';

        if (empty($baseName)) {
            return response()->json(['error' => 'Invalid command.'], 422);
        }

        // ── Blocked commands ─────────────────────────────────────────────────
        if (in_array($baseName, self::BLOCKED, true)) {
            return response()->json([
                'output'    => "Error: '{$baseName}' is blocked for safety.\n",
                'exit_code' => 1,
                'duration'  => 0,
            ]);
        }

        // ── Force-required commands ───────────────────────────────────────────
        if (in_array($baseName, self::NEEDS_FORCE, true) && ! $request->boolean('force')) {
            return response()->json([
                'error'       => 'confirm_required',
                'message'     => "'{$baseName}' is a destructive command. Are you sure?",
                'command'     => $raw,
            ], 200);
        }

        // ── Execute safely via Process (array form = no shell spawn) ─────────
        $start = microtime(true);

        try {
            $result = Process::path(base_path())
                ->timeout(30)
                ->env(['COLUMNS' => '120'])   // widen artisan table output
                ->run(array_merge(['php', 'artisan', '--no-ansi'], $parts));

            $output   = $result->output() ?: $result->errorOutput();
            $exitCode = $result->exitCode();
        } catch (\Throwable $e) {
            $output   = "Process error: " . $e->getMessage() . "\n";
            $exitCode = 1;
        }

        $duration = round((microtime(true) - $start) * 1000);

        return response()->json([
            'output'    => $output ?: "(no output)\n",
            'exit_code' => $exitCode,
            'duration'  => $duration,
            'command'   => $raw,
        ]);
    }
}
