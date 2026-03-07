import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import {
    Terminal as TerminalIcon,
    ScrollText,
    Copy, Trash2, ChevronRight, Loader2,
    CheckCircle2, XCircle, Clock, AlertTriangle,
    ChevronDown, ChevronUp, Zap,
} from 'lucide-react';

// ── ANSI strip ────────────────────────────────────────────────────────────────
const stripAnsi = (str) =>
    str
        .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '')
        .replace(/\x1B\][^\x07]*\x07/g, '')
        .replace(/\x1B[()[A-Z]/g, '');

// ── Line classifier ───────────────────────────────────────────────────────────
function classifyLine(line) {
    if (!line.trim()) return 'blank';
    if (/^\s*error[\s:]/i.test(line) || /exception|failed|fatal/i.test(line)) return 'error';
    if (/^\s*warning[\s:]/i.test(line)) return 'warning';
    if (/done|success|created|migrated|seeded|cleared|cached|linked|published/i.test(line)) return 'success';
    if (/^\s*(info|note|running)[\s:]/i.test(line)) return 'info';
    if (/^\s*\+\-+\+/.test(line) || /^\s*\|\s/.test(line)) return 'table';
    if (/^\s*\d{4}_/.test(line)) return 'migration';
    return 'default';
}
const LINE_CLS = {
    blank: '', default: 'text-gray-200', error: 'text-red-400',
    warning: 'text-yellow-400', success: 'text-green-400',
    info: 'text-sky-400', table: 'text-gray-400', migration: 'text-emerald-400',
};

// ── Quick commands ────────────────────────────────────────────────────────────
const QUICK_GROUPS = [
    { label: 'DB',      cmds: ['migrate:status', 'migrate', 'migrate:fresh --seed', 'db:seed', 'migrate:rollback'] },
    { label: 'Roles & Permissions', cmds: ['roles:seed', 'db:seed --class=RolesAndPermissionsSeeder'] },
    { label: 'Seeders', cmds: ['db:seed', 'db:seed --class=RolesAndPermissionsSeeder', 'db:seed --class=AdminUserSeeder', 'db:seed --class=AppStatsSeeder', 'ai-studio:aggregate-daily'] },
    { label: 'Merchants', cmds: ['merchants:sync-shop-details --missing', 'merchants:sync-shop-details --all'] },
    { label: 'Cache',   cmds: ['cache:clear', 'config:cache', 'config:clear', 'view:clear', 'route:clear', 'optimize', 'optimize:clear'] },
    { label: 'Info',    cmds: ['about', 'version', 'env', 'route:list --compact', 'schedule:list'] },
    { label: 'Storage', cmds: ['storage:link'] },
    { label: 'Queue',   cmds: ['queue:work --once', 'queue:work', 'queue:restart', 'queue:failed', 'queue:flush'] },
];

// ── Output line ───────────────────────────────────────────────────────────────
function OutputLine({ line }) {
    const cls = LINE_CLS[classifyLine(line)] || LINE_CLS.default;
    return <div className={`whitespace-pre font-mono text-[12.5px] leading-relaxed select-text ${cls}`}>{line || '\u00A0'}</div>;
}

// ── Entry ─────────────────────────────────────────────────────────────────────
function Entry({ entry }) {
    if (entry.type === 'system') return (
        <div className="flex items-start gap-2 py-0.5 text-gray-600 font-mono text-xs">
            <span className="text-gray-700 flex-shrink-0">#</span>
            <span className="whitespace-pre-wrap select-text">{entry.content}</span>
        </div>
    );
    if (entry.type === 'command') return (
        <div className="flex items-center gap-2 mt-3 mb-1">
            <span className="text-emerald-400 font-mono text-sm font-bold flex-shrink-0">›</span>
            <span className="font-mono text-[13px] text-white font-medium select-text flex-1">{entry.content}</span>
            <span className="text-gray-700 font-mono text-xs flex-shrink-0">{entry.time}</span>
        </div>
    );
    if (entry.type === 'running') return (
        <div className="flex items-center gap-2 py-1 text-yellow-500 font-mono text-xs">
            <Loader2 size={11} className="animate-spin flex-shrink-0" /><span>Running…</span>
        </div>
    );
    if (entry.type === 'result') {
        const lines = entry.content.split('\n').filter((_, i, arr) => !(i === arr.length - 1 && !_.trim()));
        const isErr = entry.exitCode !== 0;
        return (
            <div className="mb-1">
                <div className="pl-3 border-l border-gray-800">
                    {lines.map((line, i) => <OutputLine key={i} line={line} />)}
                </div>
                <div className={`flex items-center gap-2 mt-1 text-xs font-mono ${isErr ? 'text-red-400' : 'text-green-400'}`}>
                    {isErr ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                    <span>{isErr ? `Exit ${entry.exitCode}` : 'Done'}</span>
                    <span className="text-gray-700">·</span>
                    <Clock size={10} className="text-gray-700" />
                    <span className="text-gray-600">{entry.duration}ms</span>
                </div>
            </div>
        );
    }
    if (entry.type === 'error') return (
        <div className="flex items-start gap-2 py-0.5 text-red-400 font-mono text-xs">
            <XCircle size={11} className="mt-0.5 flex-shrink-0" />
            <span className="select-text">{entry.content}</span>
        </div>
    );
    return null;
}

// ── Quick panel ───────────────────────────────────────────────────────────────
function QuickPanel({ visible, onRun }) {
    if (!visible) return null;
    return (
        <div className="border-t border-gray-800 px-4 py-2.5 flex-shrink-0" style={{ background: '#0d1117' }}>
            <div className="space-y-1.5">
                {QUICK_GROUPS.map((g) => (
                    <div key={g.label} className="flex items-center gap-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-700 w-12 flex-shrink-0">{g.label}</span>
                        <div className="flex flex-wrap gap-1">
                            {g.cmds.map((cmd) => (
                                <button key={cmd} type="button" onClick={() => onRun(cmd)}
                                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition-colors">
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

// ── Terminal content ──────────────────────────────────────────────────────────
function TerminalContent({ phpVersion, laravelVersion, appEnv, appName }) {
    const [entries,   setEntries]   = useState([]);
    const [input,     setInput]     = useState('');
    const [running,   setRunning]   = useState(false);
    const [history,   setHistory]   = useState([]);
    const [histIdx,   setHistIdx]   = useState(-1);
    const [showQuick, setShowQuick] = useState(true);
    const [confirm,   setConfirm]   = useState(null);
    const outputRef = useRef(null);
    const inputRef  = useRef(null);

    useEffect(() => {
        if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }, [entries]);

    useEffect(() => {
        const now = new Date().toLocaleString();
        setEntries([
            { id: 0, type: 'system', content: `${appName}  ·  Laravel ${laravelVersion}  ·  PHP ${phpVersion}  ·  ${appEnv?.toUpperCase()}` },
            { id: 1, type: 'system', content: `Session started ${now}` },
            { id: 2, type: 'system', content: 'Type an Artisan command or click a quick command. Prefix "php artisan" is optional.' },
            { id: 3, type: 'system', content: '─'.repeat(72) },
        ]);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const push = useCallback((entry) =>
        setEntries((prev) => [...prev, { id: Date.now() + Math.random(), ...entry }]), []);

    const clearTerminal = () => setEntries([{ id: Date.now(), type: 'system', content: 'Terminal cleared.' }]);

    const copyAll = () => {
        const text = entries.filter((e) => e.type !== 'running')
            .map((e) => e.type === 'command' ? `$ ${e.content}` : e.content).join('\n');
        navigator.clipboard.writeText(text).catch(() => {});
    };

    const execute = useCallback(async (rawCmd, force = false) => {
        const cmd = rawCmd.trim();
        if (!cmd) return;
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        push({ type: 'command', content: cmd, time: now });
        push({ type: 'running' });
        setRunning(true); setInput(''); setHistIdx(-1);
        setHistory((h) => [cmd, ...h.filter((x) => x !== cmd)].slice(0, 100));
        try {
            const res = await fetch('/admin/terminal/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content ?? '',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ command: cmd, force }),
            });
            const data = await res.json();
            setEntries((prev) => prev.filter((e) => e.type !== 'running'));
            if (data.error === 'confirm_required') { setConfirm({ cmd, message: data.message }); return; }
            if (data.error) push({ type: 'error', content: data.error });
            else push({ type: 'result', content: stripAnsi(data.output ?? ''), exitCode: data.exit_code ?? 0, duration: data.duration ?? 0 });
        } catch (err) {
            setEntries((prev) => prev.filter((e) => e.type !== 'running'));
            push({ type: 'error', content: `Network error: ${err.message}` });
        } finally {
            setRunning(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [push]);

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!running) execute(input); return; }
        if (e.key === 'ArrowUp')   { e.preventDefault(); const n = Math.min(histIdx + 1, history.length - 1); setHistIdx(n); setInput(history[n] ?? ''); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.max(histIdx - 1, -1); setHistIdx(n); setInput(n === -1 ? '' : history[n] ?? ''); return; }
        if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); clearTerminal(); return; }
        if (e.key === 'c' && e.ctrlKey && !running) { e.preventDefault(); setInput(''); }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0d1117' }}>
            {/* Confirm dialog */}
            {confirm && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="w-full max-w-sm mx-4 rounded-xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
                            <AlertTriangle size={16} className="text-yellow-400" />
                            <p className="text-sm font-semibold text-white">Destructive Command</p>
                        </div>
                        <div className="px-5 py-4">
                            <p className="text-sm text-gray-300">{confirm.message}</p>
                            <code className="mt-2 block text-xs font-mono bg-gray-800 text-yellow-300 px-3 py-2 rounded">
                                php artisan {confirm.cmd}
                            </code>
                        </div>
                        <div className="flex gap-2 px-5 pb-4">
                            <button onClick={() => { const c = confirm; setConfirm(null); execute(c.cmd, true); }}
                                className="flex-1 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                                Run Anyway
                            </button>
                            <button onClick={() => { setConfirm(null); setTimeout(() => inputRef.current?.focus(), 50); }}
                                className="flex-1 px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-800/60 flex-shrink-0" style={{ background: '#161b22' }}>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <span className="font-mono text-[11px] text-gray-600 flex-1 text-center select-none">
                    {appName} — artisan
                </span>
                <button onClick={() => setShowQuick((v) => !v)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                    <Zap size={10} /> Quick {showQuick ? <ChevronDown size={9} /> : <ChevronUp size={9} />}
                </button>
                <button onClick={copyAll} title="Copy all"
                    className="p-1 rounded text-gray-700 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                    <Copy size={13} />
                </button>
                <button onClick={clearTerminal} title="Clear (Ctrl+L)"
                    className="p-1 rounded text-gray-700 hover:text-red-400 hover:bg-red-900/20 transition-colors">
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Output */}
            <div ref={outputRef} className="flex-1 overflow-y-auto px-5 py-3 cursor-text"
                 onClick={() => inputRef.current?.focus()}>
                {entries.map((e) => <Entry key={e.id} entry={e} />)}
                <div className="h-2" />
            </div>

            {/* Quick commands */}
            <QuickPanel visible={showQuick} onRun={(cmd) => execute(cmd)} />

            {/* Input */}
            <div className="flex items-center gap-2.5 px-5 py-3 border-t border-gray-800 flex-shrink-0" style={{ background: '#161b22' }}>
                {running
                    ? <Loader2 size={13} className="text-yellow-400 animate-spin flex-shrink-0" />
                    : <ChevronRight size={14} className="text-emerald-400 flex-shrink-0" />
                }
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setHistIdx(-1); }}
                    onKeyDown={onKeyDown}
                    disabled={running}
                    placeholder={running ? 'Running…' : 'php artisan migrate:status'}
                    spellCheck={false} autoComplete="off" autoCorrect="off" autoCapitalize="off"
                    className="flex-1 bg-transparent font-mono text-[12.5px] text-white placeholder-gray-700 outline-none caret-emerald-400 disabled:opacity-40"
                />
                <span className="hidden lg:block text-[10px] text-gray-700 font-mono flex-shrink-0">
                    ↑↓ history · Ctrl+L clear
                </span>
                <button onClick={() => !running && execute(input)} disabled={running || !input.trim()}
                    className="px-3 py-1 rounded text-[11px] font-mono font-bold bg-emerald-700/80 hover:bg-emerald-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0">
                    Run
                </button>
            </div>
        </div>
    );
}

// ── Logs tab ──────────────────────────────────────────────────────────────────
function LogsContent() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3" style={{ background: '#0d1117' }}>
            <ScrollText size={36} className="text-gray-800" />
            <div className="text-center">
                <p className="text-sm font-semibold text-gray-500">No logs yet</p>
                <p className="text-xs text-gray-700 mt-0.5">Application logs will stream here</p>
            </div>
            <div className="mt-2 px-4 py-2 rounded border border-gray-800 font-mono text-[11px] text-gray-700 max-w-sm text-center">
                Real-time log streaming — coming soon
            </div>
        </div>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
const TABS = [
    { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
    { id: 'logs',     label: 'Logs',     icon: ScrollText   },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TerminalPage({ phpVersion, laravelVersion, appEnv, appName }) {
    const [activeTab, setActiveTab] = useState('terminal');

    return (
        <AdminLayout fullHeight>
            {/* ── Tab bar ──────────────────────────────────────────────── */}
            <div
                className="flex items-stretch flex-shrink-0 border-b border-gray-800"
                style={{ background: '#161b22', height: '40px' }}
            >
                {/* Tabs */}
                {TABS.map((tab) => {
                    const Icon     = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={[
                                'relative flex items-center gap-2 px-5 h-full text-xs font-medium',
                                'border-r border-gray-800 transition-colors select-none',
                                isActive
                                    ? 'text-white bg-[#0d1117]'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50',
                            ].join(' ')}
                        >
                            {isActive && (
                                <span className="absolute top-0 left-4 right-4 h-[2px] rounded-b-sm bg-primary-400" />
                            )}
                            <Icon size={13} className="flex-shrink-0" />
                            {tab.label}
                        </button>
                    );
                })}

                {/* Right: version info — no env badge */}
                <div className="ml-auto flex items-center gap-3 px-4 flex-shrink-0">
                    <span className="hidden md:block text-[10px] font-mono text-gray-700">
                        PHP {phpVersion} · Laravel {laravelVersion}
                    </span>
                </div>
            </div>

            {/* ── Tab content ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {activeTab === 'terminal' && (
                    <TerminalContent
                        phpVersion={phpVersion}
                        laravelVersion={laravelVersion}
                        appEnv={appEnv}
                        appName={appName}
                    />
                )}
                {activeTab === 'logs' && <LogsContent />}
            </div>
        </AdminLayout>
    );
}
