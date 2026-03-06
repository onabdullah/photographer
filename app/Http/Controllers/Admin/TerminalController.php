<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Http\Request;
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

        // ── Execute inside the current PHP process — zero child process ─────────
        // We bypass the Artisan facade (whose alias 'artisan' is only bound during
        // CLI bootstrap) and use app()->make() with the concrete ConsoleKernel class.
        // The container auto-wires its constructor even without a prior binding.
        // call() bootstraps the console on-demand and captures output via BufferedOutput.
        $start = microtime(true);

        try {
            /** @var ConsoleKernel $kernel */
            $kernel = app()->make(ConsoleKernel::class);

            $buffered = new BufferedOutput();
            // array_slice($parts, 1) drops the command name (index 0)
            $exitCode = $kernel->call(
                $baseName,
                $this->parseParams(array_slice($parts, 1)),
                $buffered,
            );
            $output = $buffered->fetch();
        } catch (\Throwable $e) {
            $output   = 'Exception: ' . $e->getMessage() . "\n";
            $exitCode = 1;
        }

        $duration  = round((microtime(true) - $start) * 1000);

        return response()->json([
            'output'    => $output ?: "(no output)\n",
            'exit_code' => $exitCode,
            'duration'  => $duration,
            'command'   => $raw,
        ]);
    }
}
