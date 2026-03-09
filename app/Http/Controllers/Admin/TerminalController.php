<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Symfony\Component\Console\Output\BufferedOutput;

class TerminalController extends Controller
{
    /**
     * Parse the tokens after the command name into an Artisan parameters array.
     *
     * Handles:
     *   --key=value   → ['--key' => 'value']
     *   --flag        → ['--flag' => true]
     *   -f            → ['-f' => true]
     *   positional    → stored with a numeric key (works for simple commands)
     *
     * Flags --no-ansi and --no-interaction are always injected so output is plain.
     */
    private function parseParams(array $tokens): array
    {
        $params   = ['--no-ansi' => true, '--no-interaction' => true];
        $posIndex = 0;

        foreach ($tokens as $token) {
            if (str_starts_with($token, '--')) {
                if (str_contains($token, '=')) {
                    [$key, $value] = explode('=', $token, 2);
                    $params[$key]  = is_numeric($value) ? (int) $value : $value;
                } else {
                    $params[$token] = true;
                }
            } elseif (str_starts_with($token, '-') && strlen($token) === 2) {
                $params[$token] = true;
            } else {
                // Positional argument — numeric index
                $params[$posIndex++] = $token;
            }
        }

        return $params;
    }

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

    public function index(Request $request)
    {
        if (! $this->userCanAccessTerminal($request)) {
            abort(403, 'You do not have permission to access the developer terminal.');
        }

        return Inertia::render('Admin/Pages/Terminal/Index', [
            'phpVersion'     => PHP_VERSION,
            'laravelVersion' => app()->version(),
            'appEnv'         => config('app.env'),
            'appName'        => config('app.name'),
            'runEndpoint'    => route('admin.terminal.run'),
        ]);
    }

    /**
     * Check if the authenticated user can access the developer terminal.
     */
    private function userCanAccessTerminal(Request $request): bool
    {
        $user = $request->user('admin') ?? $request->user();
        return $user && $user->can('developer.terminal');
    }

    public function run(Request $request)
    {
        try {
            return $this->executeRun($request);
        } catch (\Throwable $e) {
            return response()->json([
                'error'   => 'Server error: ' . $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    private function executeRun(Request $request)
    {
        if (! $this->userCanAccessTerminal($request)) {
            return response()->json(['error' => 'Permission denied. You need developer.terminal access.'], 403);
        }

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

        // ── Execute via Artisan facade (works in web context; Kernel is bound to contract) ──
        // Production guard bypass: commands like `migrate` and `db:seed` skip confirmation in
        // non-interactive mode when env is production; we temporarily set env to local so
        // the command runs, then restore it.
        $start = microtime(true);

        $wasProduction = app()->isProduction();
        if ($wasProduction) {
            config(['app.env' => 'local']);
        }

        $output   = '';
        $exitCode = 0;

        try {
            $buffered = new BufferedOutput();
            $exitCode = Artisan::call(
                $baseName,
                $this->parseParams(array_slice($parts, 1)),
                $buffered,
            );
            $output = $buffered->fetch();
        } catch (\Throwable $e) {
            $output   = 'Exception: ' . $e->getMessage() . "\n";
            $exitCode = 1;
        } finally {
            if ($wasProduction) {
                config(['app.env' => 'production']);
            }
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
