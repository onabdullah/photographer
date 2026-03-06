import { useState, useEffect, useRef, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import {
    Terminal, Copy, Trash2, ChevronRight, Loader2,
    CheckCircle2, XCircle, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Zap,
} from 'lucide-react';

// ── Strip ANSI escape sequences from artisan output ───────────────────────────
const stripAnsi = (str) =>
    str
        .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
        .replace(/\x1B\][^\x07]*\x07/g, '')
        .replace(/\x1B[()[A-Z]/g, '');

// ── Detect output line semantic for colour coding ─────────────────────────────
function classifyLine(line) {
    const s = line.toLowerCase();
    if (!line.trim()) return 'blank';
    if (/^\s*error[\s:]/i.test(line) || /exception|failed|fatal/i.test(line)) return 'error';
    if (/^\s*warning[\s:]/i.test(line)) return 'warning';
    if (/done|success|created|migrated|seeded|cleared|cached|linked|published/i.test(line)) return 'success';
    if (/^\s*(info|note|running)[\s:]/i.test(line)) return 'info';
    if (/^\s*\+\-+\+/.test(line) || /^\s*\|\s/.test(line) || /^\s*\+-/.test(line)) return 'table';
    if (/^\s*\d{4}_/.test(line)) return 'migration';
    return 'default';
}

const LINE_CLS = {
    blank:     '',
    default:   'text-gray-200',
    error:     'text-red-400',
    warning:   'text-yellow-400',
    success:   'text-green-400',
    info:      'text-sky-400',
    table:     'text-gray-400 font-mono',
    migration: 'text-emerald-400',
};

// ── Quick-command groups ──────────────────────────────────────────────────────
const QUICK_GROUPS = [
    {
        label: 'Database',
        icon: '⊞',
        cmds: ['migrate:status', 'migrate', 'migrate:fresh --seed', 'db:seed', 'migrate:rollback'],
    },
    {
        label: 'Cache',
        icon: '⚡',
        cmds: ['cache:clear', 'config:cache', 'config:clear', 'view:clear', 'route:clear', 'optimize', 'optimize:clear'],
    },
    {
        label: 'Info',
        icon: 'ℹ',
        cmds: ['about', 'version', 'env', 'route:list --compact', 'schedule:list'],
    },
    {
        label: 'Storage',
        icon: '◉',
        cmds: ['storage:link'],
    },
    {
        label: 'Queue',
        icon: '↻',
        cmds: ['queue:restart', 'queue:failed', 'queue:flush'],
    },
];

// ── Single output line ────────────────────────────────────────────────────────
function OutputLine({ line }) {
    const cls = LINE_CLS[classifyLine(line)] || LINE_CLS.default;
    // Preserve leading whitespace (artisan tables use spaces for alignment)
    return (
        <div className={`whitespace-pre font-mono text-[13px] leading-relaxed select-text ${cls}`}>
            {line || '\u00A0'}
        </div>
    );
}

// ── Terminal entry block ──────────────────────────────────────────────────────
function Entry({ entry }) {
    if (entry.type === 'system') {
        return (
            <div className="flex items-start gap-2 py-1 text-gray-500 font-mono text-xs">
                <span className="flex-shrink-0 text-gray-600">#</span>
                <span className="whitespace-pre-wrap select-text">{entry.content}</span>
            </div>
        );
    }

    if (entry.type === 'command') {
        return (
            <div className="flex items-center gap-2 mt-3 mb-1">
                <span className="text-primary-400 font-mono text-sm font-bold flex-shrink-0 select-none">›</span>
                <span className="font-mono text-[13px] text-white font-medium select-text">{entry.content}</span>
                <span className="text-gray-600 font-mono text-xs ml-auto flex-shrink-0 select-none">
                    {entry.time}
                </span>
            </div>
        );
    }

    if (entry.type === 'running') {
        return (
            <div className="flex items-center gap-2 py-1.5 text-yellow-400 font-mono text-xs">
                <Loader2 size={12} className="animate-spin flex-shrink-0" />
                <span>Running…</span>
            </div>
        );
    }

    if (entry.type === 'result') {
        const lines = entry.content.split('\n').filter((_, i, arr) => {
            // Trim trailing blank lines
            if (i === arr.length - 1 && !_.trim()) return false;
            return true;
        });
        const isError = entry.exitCode !== 0;

        return (
            <div className="mb-1">
                {/* Output lines */}
                <div className="pl-4 border-l border-gray-800">
                    {lines.map((line, i) => <OutputLine key={i} line={line} />)}
                </div>
                {/* Status footer */}
                <div className={`flex items-center gap-2 mt-1.5 text-xs font-mono ${isError ? 'text-red-400' : 'text-green-400'}`}>
                    {isError
                        ? <XCircle size={12} className="flex-shrink-0" />
                        : <CheckCircle2 size={12} className="flex-shrink-0" />
                    }
                    <span>{isError ? `Exit ${entry.exitCode}` : 'Done'}</span>
                    <span className="text-gray-600">·</span>
                    <Clock size={11} className="text-gray-600 flex-shrink-0" />
                    <span className="text-gray-500">{entry.duration}ms</span>
                </div>
            </div>
        );
    }

    if (entry.type === 'error') {
        return (
            <div className="flex items-start gap-2 py-1 text-red-400 font-mono text-xs">
                <XCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span className="select-text">{entry.content}</span>
            </div>
        );
    }

    return null;
}

// ── Quick commands panel ──────────────────────────────────────────────────────
function QuickPanel({ onRun, visible }) {
    if (!visible) return null;
    return (
        <div className="border-t border-gray-800 px-4 py-3 flex-shrink-0">
            <div className="space-y-2">
                {QUICK_GROUPS.map((group) => (
                    <div key={group.label} className="flex items-start gap-2.5">
                        <span className="text-[10px] text-gray-600 font-mono w-16 flex-shrink-0 pt-0.5 uppercase tracking-wider">
                            {group.label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {group.cmds.map((cmd) => (
                                <button
                                    key={cmd}
                                    type="button"
                                    onClick={() => onRun(cmd)}
                                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors"
                                >
                                    {cmd}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Terminal Page ────────────────────────────────────────────────────────
export default function TerminalPage({ phpVersion, laravelVersion, appEnv, appName }) {
    const { props }      = usePage();
    const [entries, setEntries]     = useState([]);
    const [input, setInput]         = useState('');
    const [running, setRunning]     = useState(false);
    const [history, setHistory]     = useState([]);
    const [histIdx, setHistIdx]     = useState(-1);
    const [showQuick, setShowQuick] = useState(true);
    const [confirm, setConfirm]     = useState(null);  // pending confirm command

    const outputRef  = useRef(null);
    const inputRef   = useRef(null);

    // ── Scroll to bottom whenever entries change ──────────────────────────────
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [entries]);

    // ── Welcome banner ────────────────────────────────────────────────────────
    useEffect(() => {
        const now = new Date().toLocaleString();
        setEntries([
            { id: 0, type: 'system', content: `PhotoAdmin Terminal  ·  Laravel ${laravelVersion}  ·  PHP ${phpVersion}  ·  ${appEnv?.toUpperCase()}` },
            { id: 1, type: 'system', content: `Session started ${now}` },
            { id: 2, type: 'system', content: 'Type an Artisan command below or click a quick command. Prefix "php artisan" is optional.' },
            { id: 3, type: 'system', content: '─'.repeat(72) },
        ]);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    // ── Push entry helper ─────────────────────────────────────────────────────
    const push = useCallback((entry) =>
        setEntries((prev) => [...prev, { id: Date.now() + Math.random(), ...entry }]),
    []);

    // ── Clear ─────────────────────────────────────────────────────────────────
    const clearTerminal = () => {
        setEntries([
            { id: Date.now(), type: 'system', content: 'Terminal cleared.' },
        ]);
    };

    // ── Copy all output ───────────────────────────────────────────────────────
    const copyAll = () => {
        const text = entries
            .filter((e) => e.type !== 'running')
            .map((e) => (e.type === 'command' ? `$ ${e.content}` : e.content))
            .join('\n');
        navigator.clipboard.writeText(text).catch(() => {});
    };

    // ── Execute command ───────────────────────────────────────────────────────
    const execute = useCallback(async (rawCmd, force = false) => {
        const cmd = rawCmd.trim();
        if (!cmd) return;

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        push({ type: 'command', content: cmd, time: now });
        push({ type: 'running' });
        setRunning(true);
        setInput('');
        setHistIdx(-1);
        setHistory((h) => [cmd, ...h.filter((x) => x !== cmd)].slice(0, 100));

        try {
            const res = await fetch('/admin/terminal/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':  document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ command: cmd, force }),
            });

            const data = await res.json();

            // Remove the "running" spinner entry
            setEntries((prev) => prev.filter((e) => e.type !== 'running'));

            if (data.error === 'confirm_required') {
                // Prompt for confirmation of destructive command
                setConfirm({ cmd, message: data.message });
                return;
            }

            if (data.error) {
                push({ type: 'error', content: data.error });
            } else {
                push({
                    type:     'result',
                    content:  stripAnsi(data.output ?? ''),
                    exitCode: data.exit_code ?? 0,
                    duration: data.duration ?? 0,
                });
            }
        } catch (err) {
            setEntries((prev) => prev.filter((e) => e.type !== 'running'));
            push({ type: 'error', content: `Network error: ${err.message}` });
        } finally {
            setRunning(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [push]);

    // ── Keyboard handling ─────────────────────────────────────────────────────
    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!running) execute(input);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(histIdx + 1, history.length - 1);
            setHistIdx(next);
            setInput(history[next] ?? '');
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = Math.max(histIdx - 1, -1);
            setHistIdx(next);
            setInput(next === -1 ? '' : history[next] ?? '');
            return;
        }
        if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            clearTerminal();
            return;
        }
        if (e.key === 'c' && e.ctrlKey && running === false) {
            e.preventDefault();
            setInput('');
            return;
        }
    };

    // ── ENV badge colour ──────────────────────────────────────────────────────
    const envCls = appEnv === 'production'
        ? 'bg-red-900/50 text-red-400 border border-red-800/50'
        : appEnv === 'local'
            ? 'bg-green-900/30 text-green-400 border border-green-800/50'
            : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50';

    return (
        <AdminLayout>
            {/* ── Confirm dialog for destructive commands ── */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <AlertTriangle size={18} className="text-yellow-400 flex-shrink-0" />
                                <p className="text-sm font-semibold text-white">Destructive Command</p>
                            </div>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-300">{confirm.message}</p>
                            <code className="mt-2 block text-xs font-mono bg-gray-800 text-yellow-300 px-3 py-2 rounded-md">
                                php artisan {confirm.cmd}
                            </code>
                        </div>
                        <div className="flex gap-2 px-5 pb-4">
                            <button
                                onClick={() => { const c = confirm; setConfirm(null); execute(c.cmd, true); }}
                                className="btn btn-danger flex-1 justify-center"
                            >
                                Run Anyway
                            </button>
                            <button
                                onClick={() => { setConfirm(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                                className="btn btn-secondary flex-1 justify-center"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Terminal card — fixed viewport height, internal scroll only ── */}
            {/* h-[calc(100vh-X)] where X = top-band(36px) + p-6 top+bottom(48px) + footer(30px) */}
            <div
                className="rounded-xl overflow-hidden border border-gray-700/60 shadow-2xl shadow-black/40 flex flex-col"
                style={{ background: '#0d1117', height: 'calc(100vh - 130px)' }}
            >

                {/* ─── Title bar ───────────────────────────────────────────── */}
                <div className="flex items-center gap-3 px-4 h-11 flex-shrink-0 border-b border-gray-800/80"
                     style={{ background: '#161b22' }}>

                    {/* macOS-style traffic lights (decorative) */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>

                    {/* Title */}
                    <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                        <Terminal size={13} className="text-gray-500 flex-shrink-0" />
                        <span className="font-mono text-xs text-gray-400 font-medium tracking-wide truncate">
                            {appName} — artisan
                        </span>
                        <span className={`flex-shrink-0 px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wider font-mono ${envCls}`}>
                            {appEnv}
                        </span>
                        <span className="hidden md:block text-[10px] text-gray-600 font-mono flex-shrink-0">
                            PHP {phpVersion} · Laravel {laravelVersion}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            onClick={() => setShowQuick((v) => !v)}
                            title="Toggle quick commands"
                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono text-gray-500 hover:text-gray-200 hover:bg-gray-700/60 transition-colors"
                        >
                            <Zap size={11} />
                            Quick
                            {showQuick ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                        </button>
                        <button
                            onClick={copyAll}
                            title="Copy all output"
                            className="p-1.5 rounded text-gray-500 hover:text-gray-200 hover:bg-gray-700/60 transition-colors"
                        >
                            <Copy size={14} />
                        </button>
                        <button
                            onClick={clearTerminal}
                            title="Clear terminal (Ctrl+L)"
                            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                {/* ─── Output area ─────────────────────────────────────────── */}
                <div
                    ref={outputRef}
                    className="flex-1 overflow-y-auto px-5 py-4 font-mono text-[13px] leading-relaxed scroll-smooth"
                    style={{ background: '#0d1117' }}
                    onClick={() => inputRef.current?.focus()}
                >
                    {entries.map((entry) => (
                        <Entry key={entry.id} entry={entry} />
                    ))}
                    {/* Spacer so last line isn't flush against the bottom */}
                    <div className="h-2" />
                </div>

                {/* ─── Quick commands ───────────────────────────────────────── */}
                <QuickPanel
                    visible={showQuick}
                    onRun={(cmd) => { setInput(cmd); setTimeout(() => execute(cmd), 0); }}
                />

                {/* ─── Input row ────────────────────────────────────────────── */}
                <div
                    className="flex items-center gap-2.5 px-5 py-3 flex-shrink-0 border-t border-gray-800"
                    style={{ background: '#161b22' }}
                >
                    {/* Prompt symbol */}
                    {running
                        ? <Loader2 size={14} className="text-yellow-400 animate-spin flex-shrink-0" />
                        : <ChevronRight size={15} className="text-primary-400 flex-shrink-0" />
                    }

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setHistIdx(-1); }}
                        onKeyDown={onKeyDown}
                        disabled={running}
                        placeholder={running ? 'Running…' : 'php artisan migrate:status'}
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        className="flex-1 bg-transparent font-mono text-[13px] text-white placeholder-gray-700 outline-none caret-primary-400 disabled:opacity-40"
                        style={{ letterSpacing: '0.01em' }}
                    />

                    {/* Hints */}
                    <span className="hidden sm:block text-[10px] text-gray-700 font-mono flex-shrink-0 select-none">
                        ↑↓ history · Enter run · Ctrl+L clear
                    </span>

                    <button
                        onClick={() => !running && execute(input)}
                        disabled={running || !input.trim()}
                        className="flex-shrink-0 px-3 py-1 rounded text-[11px] font-mono font-semibold
                                   bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-30
                                   disabled:cursor-not-allowed transition-colors"
                    >
                        Run
                    </button>
                </div>
            </div>

            {/* Info moved into terminal title bar — no extra element needed here */}
        </AdminLayout>
    );
}
