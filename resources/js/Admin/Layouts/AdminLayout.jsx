import { useState, useEffect, useCallback, useRef } from 'react';
import { FlashToaster } from '@/Components/GlobalToast';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Store,
    Zap,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Sun,
    Moon,
    Menu,
    Plus,
    Lightbulb,
    Bot,
    FileBarChart2,
    Crown,
    ShieldCheck,
    Eye,
    Users,
    Shield,
    TerminalSquare,
    X,
    Sparkles,
    DollarSign,
    CreditCard,
    Package,
} from 'lucide-react';

// ============================================================
// LAYOUT CONSTANTS
// ============================================================

// h-9 = 36px — the thin top band that holds brand + user
const BAND_H     = 'h-9';
const BAND_PX_H  = 36; // px — used for sidebar top offset

// Sidebar widths
const W_EXPANDED  = 'w-56';   // 224px
const W_COLLAPSED = 'w-[58px]';

// ============================================================
// NAVIGATION CONFIG
// ============================================================

const SECTIONS = [
    {
        id: 'main',
        label: 'MAIN',
        items: [
            { name: 'Dashboard',     href: '/admin/dashboard',     icon: LayoutDashboard, permission: 'dashboard.view' },
        ],
    },
    {
        id: 'management',
        label: 'MANAGEMENT',
        items: [
            { name: 'Merchants',     href: '/admin/merchants',     icon: Store,       permission: 'merchants.view' },
            { name: 'AI Processing', href: '/admin/ai-processing', icon: Zap,         permission: 'ai.view'        },
            { name: 'Plans',         href: '/admin/plans',         icon: CreditCard,  permission: 'plans.view'     },
            { name: 'Credit Packs',  href: '/admin/credit-packs',  icon: Package,     permission: 'plans.view'     },
        ],
    },
    {
        id: 'reports',
        label: 'REPORTS',
        items: [
            { name: 'AI Tools Analysis', href: '/admin/ai-studio-tools', icon: Sparkles, permission: 'ai_studio.view' },
            { name: 'Analytics',     href: '/admin/analytics',     icon: BarChart3, permission: 'analytics.view' },
        ],
    },
    {
        id: 'teams',
        label: 'TEAM',
        items: [
            { name: 'Users',         href: '/admin/users',         icon: Users,    permission: 'users.view' },
            { name: 'Roles',         href: '/admin/roles',         icon: Shield,   permission: 'roles.view' },
        ],
    },
    {
        id: 'system',
        label: 'SYSTEM',
        items: [
            { name: 'Settings', href: '/admin/settings', icon: Settings, permission: 'settings.view' },
            {
                name: 'Coming Soon',
                icon: Lightbulb,
                permission: null,
                badge: 'BETA',
                badgeColor: 'secondary',
                collapsible: true,
                children: [
                    { name: 'AI Models', icon: Bot,           href: '#' },
                    { name: 'Reports',   icon: FileBarChart2, href: '#' },
                    { name: 'Finance',   icon: DollarSign,     href: '#' },
                ],
            },
        ],
    },
];

const QUICK_ACTIONS = [
    { name: 'New Merchant',     href: '/admin/merchants/create',        icon: Plus,    permission: 'merchants.manage' },
    { name: 'View Models',      href: '/admin/ai-studio-tools?tab=models', icon: Sparkles, permission: 'ai_studio.view' },
    { name: 'Magic Eraser',     href: '/admin/ai-processing?tool=magic_eraser', icon: Zap, permission: 'ai.view' },
];

// ============================================================
// ROLE CONFIG — no gradients, solid tints only
// ============================================================

const ROLE_CONFIG = {
    super_admin: {
        label: 'Super Admin',
        icon: Crown,
        cls: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700/50',
        iconCls: 'text-primary-500 dark:text-primary-400',
    },
    admin: {
        label: 'Admin',
        icon: ShieldCheck,
        cls: 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600',
        iconCls: 'text-gray-500 dark:text-gray-400',
    },
    viewer: {
        label: 'Viewer',
        icon: Eye,
        cls: 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-700 dark:text-secondary-300 border border-secondary-200 dark:border-secondary-700/50',
        iconCls: 'text-secondary-500 dark:text-secondary-400',
    },
};

// ============================================================
// PERMISSIONS HOOK
// ============================================================

function usePermissions() {
    const { props } = usePage();
    const role        = props.auth?.user?.role        || 'super_admin';
    const permissions = props.auth?.user?.permissions || [];

    const can = useCallback(
        (permission) => {
            if (!permission)               return true;
            if (role === 'super_admin')    return true;
            if (permissions.includes('*')) return true;
            return permissions.includes(permission);
        },
        [role, permissions],
    );

    return { can, role };
}

// ============================================================
// NAV ITEM
// ============================================================

function NavItem({ name, href, icon: Icon, isActive, iconOnly, badge, badgeColor }) {
    return (
        <Link
            href={href}
            prefetch
            title={iconOnly ? name : undefined}
            aria-label={iconOnly ? name : undefined}
            className={[
                'group flex items-center rounded-md text-sm transition-colors duration-150',
                'mx-2 px-2.5 py-2 min-h-[34px]',
                iconOnly ? 'justify-center' : '',
                isActive
                    ? 'bg-primary-600 text-white font-semibold'
                    : 'font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
            ].filter(Boolean).join(' ')}
        >
            <Icon
                size={16}
                className={[
                    'flex-shrink-0',
                    isActive
                        ? 'text-white'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                    !iconOnly ? 'mr-2.5' : '',
                ].filter(Boolean).join(' ')}
            />
            {!iconOnly && (
                <>
                    <span className="flex-1 truncate">{name}</span>
                    {badge && (
                        <span className={[
                            'ml-2 flex-shrink-0 px-1.5 py-px rounded text-[10px] font-bold tracking-wide uppercase',
                            badgeColor === 'secondary'
                                ? 'bg-secondary-500 text-white'
                                : 'bg-primary-500 text-white',
                        ].join(' ')}>
                            {badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
}

// ============================================================
// COLLAPSIBLE NAV ITEM  (Coming Soon)
// ============================================================

function CollapsibleNavItem({ name, icon: Icon, badge, badgeColor, children, iconOnly }) {
    const [open, setOpen] = useState(false);

    if (iconOnly) {
        return (
            <button
                title={name}
                aria-label={name}
                className="group flex items-center justify-center mx-2 px-2.5 py-2 rounded-md text-sm font-medium min-h-[34px] w-[calc(100%-1rem)] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Icon size={16} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="group flex items-center mx-2 px-2.5 py-2 rounded-md text-sm font-medium min-h-[34px] w-[calc(100%-1rem)] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <Icon
                    size={16}
                    className="flex-shrink-0 mr-2.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                />
                <span className="flex-1 truncate text-left">{name}</span>
                {badge && (
                    <span className={[
                        'mr-2 flex-shrink-0 px-1.5 py-px rounded text-[10px] font-bold tracking-wide uppercase',
                        badgeColor === 'secondary'
                            ? 'bg-secondary-500 text-white'
                            : 'bg-primary-500 text-white',
                    ].join(' ')}>
                        {badge}
                    </span>
                )}
                {open
                    ? <ChevronUp  size={13} className="flex-shrink-0 text-gray-400" />
                    : <ChevronDown size={13} className="flex-shrink-0 text-gray-400" />
                }
            </button>

            {open && (
                <div className="ml-3 mt-0.5 mb-1 space-y-px border-l border-gray-200 dark:border-gray-700 ml-5 pl-2">
                    {children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                prefetch
                                className="flex items-center px-2.5 py-1.5 mx-1 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <ChildIcon size={14} className="mr-2 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                                {child.name}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ============================================================
// USER MENU DROPDOWN — in the top band
// ============================================================

function UserMenu({ user, role, theme, onToggleTheme }) {
    const [open, setOpen]    = useState(false);
    const ref                = useRef(null);
    const roleCfg            = ROLE_CONFIG[role] || ROLE_CONFIG.super_admin;
    const RoleIcon           = roleCfg.icon;
    const userInitial        = user?.name?.charAt(0)?.toUpperCase() || 'A';

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    return (
        <div ref={ref} className="relative flex items-center gap-1">

            {/* Theme toggle — compact, matches band height */}
            <button
                onClick={onToggleTheme}
                className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors"
                aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Thin separator */}
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-0.5" />

            {/* User trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 px-2 h-7 rounded-md hover:bg-gray-200/80 dark:hover:bg-gray-700 transition-colors"
                aria-expanded={open}
                aria-label="User menu"
            >
                {/* Solid avatar — no gradient */}
                <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-white leading-none">{userInitial}</span>
                </div>
                <span className="hidden sm:block text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                    {user?.name || 'Admin'}
                </span>
                <ChevronDown
                    size={12}
                    className={['text-gray-500 dark:text-gray-400 transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
                />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-56 z-50 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden">

                    {/* User info */}
                    <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700/70">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">{userInitial}</span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </div>
                        <span className={[
                            'mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium',
                            roleCfg.cls,
                        ].join(' ')}>
                            <RoleIcon size={9} className={roleCfg.iconCls} />
                            {roleCfg.label}
                        </span>
                    </div>

                    <div className="p-1">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            <LogOut size={13} className="flex-shrink-0" />
                            Sign out
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// BREADCRUMBS — shown inline in main content
// ============================================================

function Breadcrumbs({ crumbs }) {
    if (!crumbs?.length) return null;
    const last = crumbs.length - 1;
    return (
        <nav className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap" aria-label="Breadcrumb">
            {/* "Home" always links to the dashboard */}
            <Link
                href="/admin/dashboard"
                prefetch
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
                Home
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={10} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
                    {/* Items with href are clickable; last item (current page) is plain text */}
                    {crumb.href && i !== last ? (
                        <Link
                            href={crumb.href}
                            prefetch
                            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className={i === last
                            ? 'text-gray-700 dark:text-gray-300 font-medium'
                            : 'text-gray-400 dark:text-gray-500'
                        }>
                            {crumb.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}

// ============================================================
// DEVELOPER PANEL  —  expandable section pinned to sidebar bottom
// ============================================================

function DeveloperPanel({ iconOnly }) {
    const [open, setOpen] = useState(false);

    // Icon-only: just the terminal icon — use Link for same-tab navigation
    if (iconOnly) {
        return (
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 flex justify-center py-2">
                <Link
                    href="/admin/terminal"
                    prefetch
                    title="Developer"
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <TerminalSquare size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800">

            {/* Expanded: Artisan Terminal link */}
            {open && (
                <div className="border-b border-gray-200 dark:border-gray-800 py-1.5 px-2"
                     style={{ background: 'rgba(0,0,0,0.02)' }}>
                    <Link
                        href="/admin/terminal"
                        prefetch
                        className="group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                    >
                        <TerminalSquare size={15}
                            className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">Artisan Terminal</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-tight">Run artisan commands</p>
                        </div>
                        <ChevronRight size={11}
                            className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-primary-400 transition-colors opacity-0 group-hover:opacity-100"
                        />
                    </Link>
                </div>
            )}

            {/* DEVELOPER toggle */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="group w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
                <TerminalSquare size={13}
                    className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors"
                />
                <span className="flex-1 text-left text-[10px] font-bold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Developer
                </span>
                {open
                    ? <ChevronDown size={12} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    : <ChevronUp   size={12} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
                }
            </button>
        </div>
    );
}

// ============================================================
// ADMIN LAYOUT
// ============================================================

/**
 * AdminLayout
 *
 * Structure (matches Shopify dev dashboard pattern):
 *
 *   ┌──────────────────────────────────────────────┐  ← TOP BAND (h-9, fixed, full-width)
 *   │  [Logo] PhotoAdmin          [☀] [User ▾]    │    brand lives HERE — outside the sidebar
 *   ├──────────────┬───────────────────────────────┤
 *   │              │  Page Title (H1)              │
 *   │   SIDEBAR    │  Breadcrumbs                  │
 *   │  (fixed,     │  ─────────────────────────    │
 *   │   separate   │  {children}                   │
 *   │   panel)     │                               │
 *   └──────────────┴───────────────────────────────┘
 *
 * Props:
 *   title         {string}    — Rendered as H1 inside main content
 *   subtitle      {string}    — Muted line below title
 *   breadcrumbs   {Array}     — [{label, href?}] above the title
 *   headerActions {ReactNode} — Action buttons next to the title
 *   centerHeader  {boolean}  — Center title, breadcrumbs, and headerActions
 *   children      {ReactNode} — Page body
 */
export default function AdminLayout({ children, title, subtitle, breadcrumbs, headerActions, centerHeader = false, fullHeight = false }) {
    const { url, props } = usePage();
    const branding = props?.branding || null;
    const { can, role }  = usePermissions();

    // ── Theme ────────────────────────────────────────────────
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const stored     = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved   = stored === 'dark' || stored === 'light' ? stored : (systemDark ? 'dark' : 'light');
        setTheme(resolved);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
    }, []);

    const toggleTheme = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.add('no-transitions');
        document.documentElement.classList.toggle('dark', next === 'dark');
        localStorage.setItem('theme', next);
        setTheme(next);
        requestAnimationFrame(() => requestAnimationFrame(() =>
            document.documentElement.classList.remove('no-transitions'),
        ));
    }, [theme]);

    // ── Sidebar state ────────────────────────────────────────
    const [collapsed,  setCollapsed]  = useState(false);
    const [hovered,    setHovered]    = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => { setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true'); }, []);
    useEffect(() => { setMobileOpen(false); }, [url]);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', String(next));
            return next;
        });
        setHovered(false);
    }, []);

    const iconOnly   = collapsed && !hovered && !mobileOpen;
    const sidebarW   = iconOnly ? W_COLLAPSED : W_EXPANDED;

    // Developer mode — detected from the current URL (must be before contentPad)
    const isDevMode = url.startsWith('/admin/terminal');
    const contentPad = isDevMode ? '' : (iconOnly ? 'lg:pl-[58px]' : 'lg:pl-56');

    const isActive = (href) => {
        if (href === '/admin/dashboard') return url === href || url === '/admin';
        return url.startsWith(href);
    };

    const user = props.auth?.user;

    return (
        <>
        <FlashToaster />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">

            {/* ══════════════════════════════════════════════════
                TOP BAND  —  fixed, full-width, h-9 (36px)
                Brand name lives here, OUTSIDE the sidebar panel.
                User menu + theme toggle live here as well.
            ══════════════════════════════════════════════════ */}
            <div className="fixed top-0 left-0 right-0 z-50 h-9 flex items-center px-3 gap-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/80">

                {/* Mobile hamburger — hidden in developer mode */}
                {!isDevMode && (
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Open navigation"
                    >
                        <Menu size={15} />
                    </button>
                )}

                {/* ── Brand: logo + name (from Settings > General) ── */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {branding?.app_logo_url ? (
                        <img src={branding.app_logo_url} alt="" className="w-6 h-6 rounded-md object-contain flex-shrink-0" />
                    ) : (
                        <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor" aria-hidden="true">
                                <path d="M12 3a9 9 0 110 18A9 9 0 0112 3zm0 2a7 7 0 100 14A7 7 0 0012 5zm-1 3h2v5h3l-4 4-4-4h3V8z" />
                            </svg>
                        </div>
                    )}
                    <span className="font-brand text-[15px] leading-none text-gray-900 dark:text-white hidden sm:block">
                        {branding?.app_name || 'PhotoAdmin'}
                    </span>
                </div>

                {/* Separator */}
                <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1" />

                {/* Desktop sidebar collapse toggle — hidden in developer mode */}
                {!isDevMode && (
                    <button
                        onClick={toggleSidebar}
                        className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>
                )}

                {/* ── Right: user menu + theme ── */}
                <div className="ml-auto">
                    <UserMenu user={user} role={role} theme={theme} onToggleTheme={toggleTheme} />
                </div>
            </div>

            {/* ── Mobile backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
                    style={{ top: BAND_PX_H }}
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ══════════════════════════════════════════════════
                SIDEBAR  —  separate fixed panel, starts BELOW the band
                Hidden when developer mode is active
            ══════════════════════════════════════════════════ */}
            {!isDevMode && (
            <aside
                onMouseEnter={() => collapsed && !mobileOpen && setHovered(true)}
                onMouseLeave={() => collapsed && setHovered(false)}
                className={[
                    // Positioning: starts at bottom of top band
                    'fixed left-0 bottom-0 z-40 flex flex-col',
                    'bg-white dark:bg-gray-900',
                    'border-r border-gray-200 dark:border-gray-700/70',
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    sidebarW,
                    // Sits below the top band
                    'top-9',
                    // Mobile: slide in/out; desktop: always visible
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0',
                    // Peek shadow when hovering a collapsed sidebar
                    collapsed && hovered ? 'shadow-xl shadow-black/15 dark:shadow-black/40' : '',
                ].filter(Boolean).join(' ')}
                aria-label="Sidebar navigation"
            >
                {/* Mobile-only close row */}
                <div className="lg:hidden flex items-center justify-end px-2 py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center w-7 h-7 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close menu"
                    >
                        <ChevronLeft size={14} />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" aria-label="Main navigation">
                    {SECTIONS.map(({ id, label, items }) => {
                        const visible = items.filter((item) => can(item.permission));
                        if (!visible.length) return null;

                        return (
                            <div key={id} className="mb-1">
                                {/* Section header */}
                                {iconOnly ? (
                                    <div className="mx-3 my-2 border-t border-gray-200 dark:border-gray-700/60" />
                                ) : (
                                    <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.09em]">
                                        {label}
                                    </p>
                                )}

                                {visible.map((item) =>
                                    item.collapsible ? (
                                        <CollapsibleNavItem key={item.name} {...item} iconOnly={iconOnly} />
                                    ) : (
                                        <NavItem key={item.href} {...item} isActive={isActive(item.href)} iconOnly={iconOnly} />
                                    )
                                )}
                            </div>
                        );
                    })}

                    {/* Quick Actions */}
                    {!iconOnly && QUICK_ACTIONS.some((a) => can(a.permission)) && (
                        <div className="mb-1">
                            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.09em]">
                                QUICK ACTIONS
                            </p>
                            {QUICK_ACTIONS.filter((a) => can(a.permission)).map((action) => (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    prefetch
                                    className="flex items-center gap-2 mx-2 px-2.5 py-2 rounded-md text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors min-h-[32px]"
                                >
                                    <Plus size={11} className="flex-shrink-0 text-secondary-500" />
                                    {action.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="h-3" />
                </nav>

                {/* ── DEVELOPER expandable section — sidebar bottom (requires developer.terminal) ── */}
                {can('developer.terminal') && <DeveloperPanel iconOnly={iconOnly} />}

            </aside>
            )}

            {/* ══════════════════════════════════════════════════
                MAIN CONTENT WRAPPER
            ══════════════════════════════════════════════════ */}
            <div className={[
                fullHeight ? 'h-screen overflow-hidden' : 'min-h-screen',
                'flex flex-col',
                'pt-9',       // clears the top band
                contentPad,   // clears the sidebar on desktop
                'transition-[padding] duration-200 ease-in-out',
            ].join(' ')}>

                {/* ── Developer Mode impersonation bar ────────────────────
                    Shown whenever the current URL is a developer route.
                    Matches the "impersonation" pattern used in many admin panels —
                    a thin full-width strip signalling a special mode with an exit.
                ──────────────────────────────────────────────────────────── */}
                {isDevMode && (
                    <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 h-8 border-b border-secondary-200/60 dark:border-secondary-800/30 bg-secondary-50 dark:bg-secondary-900/20">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <TerminalSquare size={13} className="text-secondary-500 dark:text-secondary-400 flex-shrink-0" />
                            <span className="text-xs font-bold text-secondary-700 dark:text-secondary-300 tracking-wide">
                                Developer Mode
                            </span>
                            <span className="text-[10px] text-secondary-500 dark:text-secondary-500 hidden sm:block truncate">
                                — changes made here affect the live application
                            </span>
                        </div>
                        <Link
                            href="/admin/dashboard"
                            prefetch
                            className="flex-shrink-0 text-xs font-bold text-secondary-700 dark:text-secondary-300 tracking-wide animate-blink-slow hover:opacity-100 hover:animate-none"
                        >
                            click here to exit
                        </Link>
                        <div className="flex-1 min-w-0" aria-hidden="true" />
                    </div>
                )}

                {/* ── Page content ── */}
                <main
                    id="main-content"
                    className={fullHeight ? 'flex-1 overflow-hidden flex flex-col' : 'flex-1 p-6'}
                >
                    {!fullHeight && centerHeader ? (
                        /* Centered content block: header (breadcrumbs left, button right) + children */
                        <div className="max-w-5xl mx-auto space-y-6">
                            {(title || breadcrumbs?.length > 0 || headerActions) && (
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        {title && (
                                            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                                {title}
                                            </h1>
                                        )}
                                        {breadcrumbs?.length > 0 && (
                                            <div className="mt-1">
                                                <Breadcrumbs crumbs={breadcrumbs} />
                                            </div>
                                        )}
                                    </div>
                                    {headerActions && (
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {headerActions}
                                        </div>
                                    )}
                                </div>
                            )}
                            {children}
                        </div>
                    ) : !fullHeight && (title || breadcrumbs?.length > 0 || headerActions) ? (
                        /* Default full-width header */
                        <>
                            <div className="flex items-start justify-between gap-4 mb-6">
                                <div className="min-w-0">
                                    {title && (
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                            {title}
                                        </h1>
                                    )}
                                    {breadcrumbs?.length > 0 && (
                                        <div className="mt-1">
                                            <Breadcrumbs crumbs={breadcrumbs} />
                                        </div>
                                    )}
                                </div>
                                {headerActions && (
                                    <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                        {headerActions}
                                    </div>
                                )}
                            </div>
                            {children}
                        </>
                    ) : (
                        children
                    )}
                </main>

                {/* ── Footer (hidden in fullHeight mode) ── */}
                {!fullHeight && (
                    <footer className="px-6 py-1.5 border-t border-gray-200 dark:border-gray-700/50">
                        <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                            &copy; {new Date().getFullYear()} {branding?.app_name || 'PhotoAdmin'} &mdash; Built by Muhammad Abdullah
                        </p>
                    </footer>
                )}
            </div>
        </div>
        </>
    );
}
