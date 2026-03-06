import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Store,
    Package,
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
    User,
} from 'lucide-react';

// ============================================================
// NAVIGATION CONFIG
// ============================================================

const SECTIONS = [
    {
        id: 'main',
        label: 'MAIN',
        items: [
            {
                name: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
        ],
    },
    {
        id: 'management',
        label: 'MANAGEMENT',
        items: [
            {
                name: 'Merchants',
                href: '/admin/merchants',
                icon: Store,
                permission: 'merchants.view',
            },
            {
                name: 'Products',
                href: '/admin/products',
                icon: Package,
                permission: 'products.view',
            },
            {
                name: 'AI Processing',
                href: '/admin/ai-processing',
                icon: Zap,
                permission: 'ai.view',
            },
        ],
    },
    {
        id: 'reports',
        label: 'REPORTS',
        items: [
            {
                name: 'Analytics',
                href: '/admin/analytics',
                icon: BarChart3,
                permission: 'analytics.view',
            },
        ],
    },
    {
        id: 'system',
        label: 'SYSTEM',
        items: [
            {
                name: 'Settings',
                href: '/admin/settings',
                icon: Settings,
                permission: 'settings.view',
            },
            // Collapsible "Coming Soon" section with BETA badge
            {
                name: 'Coming Soon',
                icon: Lightbulb,
                permission: null,
                badge: 'BETA',
                badgeColor: 'secondary', // uses secondary-500 orange
                collapsible: true,
                children: [
                    { name: 'AI Models', icon: Bot,          href: '#' },
                    { name: 'Reports',   icon: FileBarChart2, href: '#' },
                ],
            },
        ],
    },
];

const QUICK_ACTIONS = [
    { name: 'New Merchant',  href: '/admin/merchants/create', icon: Plus,    permission: 'merchants.manage' },
    { name: 'View Products', href: '/admin/products',         icon: Package, permission: 'products.view'   },
];

// ============================================================
// ROLE CONFIG
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
            if (!permission)                      return true;
            if (role === 'super_admin')            return true;
            if (permissions.includes('*'))         return true;
            return permissions.includes(permission);
        },
        [role, permissions],
    );

    return { can, role };
}

// ============================================================
// NAV ITEM COMPONENT
// ============================================================

function NavItem({ name, href, icon: Icon, isActive, iconOnly, badge, badgeColor }) {
    return (
        <Link
            href={href}
            title={iconOnly ? name : undefined}
            aria-label={iconOnly ? name : undefined}
            className={[
                'group flex items-center px-3 py-2 mx-2 rounded-lg text-sm font-medium',
                'transition-colors duration-150 min-h-[38px]',
                iconOnly ? 'justify-center' : '',
                isActive
                    ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70',
            ].filter(Boolean).join(' ')}
        >
            <Icon
                size={17}
                className={[
                    'flex-shrink-0',
                    isActive
                        ? 'text-white'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                    !iconOnly ? 'mr-3' : '',
                ].filter(Boolean).join(' ')}
            />
            {!iconOnly && (
                <>
                    <span className="flex-1 truncate">{name}</span>
                    {badge && (
                        <span className={[
                            'ml-2 flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase',
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
// COLLAPSIBLE NAV ITEM (Coming Soon pattern)
// ============================================================

function CollapsibleNavItem({ name, icon: Icon, badge, badgeColor, children, iconOnly }) {
    const [open, setOpen] = useState(false);

    if (iconOnly) {
        return (
            <button
                title={name}
                aria-label={name}
                className="group flex items-center justify-center px-3 py-2 mx-2 rounded-lg text-sm font-medium min-h-[38px] w-[calc(100%-1rem)] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
            >
                <Icon size={17} className="flex-shrink-0 text-gray-400 dark:text-gray-500" />
            </button>
        );
    }

    return (
        <div>
            <button
                onClick={() => setOpen(!open)}
                className="group flex items-center px-3 py-2 mx-2 rounded-lg text-sm font-medium min-h-[38px] w-[calc(100%-1rem)] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
            >
                <Icon
                    size={17}
                    className="flex-shrink-0 mr-3 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                />
                <span className="flex-1 truncate text-left">{name}</span>
                {badge && (
                    <span className={[
                        'mr-2 flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase',
                        badgeColor === 'secondary'
                            ? 'bg-secondary-500 text-white'
                            : 'bg-primary-500 text-white',
                    ].join(' ')}>
                        {badge}
                    </span>
                )}
                {open
                    ? <ChevronUp size={14} className="flex-shrink-0 text-gray-400" />
                    : <ChevronDown size={14} className="flex-shrink-0 text-gray-400" />
                }
            </button>

            {open && (
                <div className="ml-4 mt-0.5 mb-1 space-y-0.5">
                    {children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                            <Link
                                key={child.href}
                                href={child.href}
                                className="flex items-center px-3 py-1.5 mx-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
                            >
                                <ChildIcon size={15} className="mr-2.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
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
// USER PROFILE DROPDOWN (top-bar right corner)
// ============================================================

function UserMenu({ user, role, theme, onToggleTheme }) {
    const [open, setOpen] = useState(false);
    const ref             = useRef(null);
    const roleCfg         = ROLE_CONFIG[role] || ROLE_CONFIG.super_admin;
    const RoleIcon        = roleCfg.icon;
    const userInitial     = user?.name?.charAt(0)?.toUpperCase() || 'A';

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative flex items-center gap-2">

            {/* Dark mode toggle */}
            <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

            {/* Avatar trigger */}
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                aria-label="User menu"
                aria-expanded={open}
            >
                {/* Avatar circle — gradient primary→secondary */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold shadow-sm"
                     style={{ background: 'linear-gradient(135deg, #3b7a8a 0%, #FF7A30 100%)' }}>
                    {userInitial}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                        {user?.name || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        {roleCfg.label}
                    </p>
                </div>
                <ChevronDown
                    size={14}
                    className={[
                        'hidden md:block flex-shrink-0 text-gray-400 transition-transform duration-150',
                        open ? 'rotate-180' : '',
                    ].join(' ')}
                />
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-60 z-50 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden">

                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/70">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-base font-bold"
                                 style={{ background: 'linear-gradient(135deg, #3b7a8a 0%, #FF7A30 100%)' }}>
                                {userInitial}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                        </div>
                        {/* Role badge */}
                        <div className="mt-2.5">
                            <span className={[
                                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium',
                                roleCfg.cls,
                            ].join(' ')}>
                                <RoleIcon size={10} className={roleCfg.iconCls} />
                                {roleCfg.label}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-1.5">
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            onClick={() => setOpen(false)}
                        >
                            <LogOut size={15} className="flex-shrink-0" />
                            Sign out
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// BREADCRUMBS
// ============================================================

function Breadcrumbs({ crumbs }) {
    if (!crumbs?.length) return null;
    return (
        <nav
            className="hidden lg:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
            aria-label="Breadcrumb"
        >
            <Link
                href="/admin/dashboard"
                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
                Home
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={11} className="flex-shrink-0 text-gray-300 dark:text-gray-600" />
                    {crumb.href ? (
                        <Link
                            href={crumb.href}
                            className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {crumb.label}
                        </span>
                    )}
                </span>
            ))}
        </nav>
    );
}

// ============================================================
// MAIN ADMIN LAYOUT
// ============================================================

/**
 * AdminLayout — Professional admin panel layout.
 *
 * Props:
 *   title         {string}    — Page title in the top bar H1
 *   subtitle      {string}    — Optional subtitle
 *   breadcrumbs   {Array}     — [{label, href?}]
 *   headerActions {ReactNode} — Buttons shown in top-bar right slot
 *   children      {ReactNode} — Page content
 */
export default function AdminLayout({
    children,
    title,
    subtitle,
    breadcrumbs,
    headerActions,
}) {
    const { url, props } = usePage();
    const { can, role }  = usePermissions();

    // ── Theme ────────────────────────────────────────────────
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const stored     = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved   = stored === 'dark' || stored === 'light'
            ? stored
            : systemDark ? 'dark' : 'light';
        setTheme(resolved);
        if (resolved === 'dark') document.documentElement.classList.add('dark');
        else                     document.documentElement.classList.remove('dark');
    }, []);

    const toggleTheme = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.add('no-transitions');
        if (next === 'dark') document.documentElement.classList.add('dark');
        else                 document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', next);
        setTheme(next);
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                document.documentElement.classList.remove('no-transitions'),
            ),
        );
    }, [theme]);

    // ── Sidebar state ────────────────────────────────────────
    const [collapsed,  setCollapsed]  = useState(false);
    const [hovered,    setHovered]    = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Restore persisted state after mount (avoids SSR mismatch)
    useEffect(() => {
        setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [url]);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', String(next));
            return next;
        });
        setHovered(false);
    }, []);

    // icon-only = collapsed + not hovered + not mobile open
    const iconOnly = collapsed && !hovered && !mobileOpen;

    const isActive = (href) => {
        if (href === '/admin/dashboard') return url === href || url === '/admin';
        return url.startsWith(href);
    };

    const user       = props.auth?.user;
    const sidebarW   = iconOnly ? 'w-[68px]' : 'w-64';
    const contentPad = iconOnly ? 'lg:pl-[68px]' : 'lg:pl-64';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">

            {/* ── Mobile backdrop ── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ══════════════════════════════
                SIDEBAR
            ══════════════════════════════ */}
            <aside
                onMouseEnter={() => collapsed && !mobileOpen && setHovered(true)}
                onMouseLeave={() => collapsed && setHovered(false)}
                className={[
                    'fixed top-0 left-0 h-screen z-40 flex flex-col',
                    'bg-white dark:bg-gray-900',
                    'border-r border-gray-100 dark:border-gray-800',
                    'overflow-hidden',
                    // Smooth width + slide transition
                    'transition-all duration-200 ease-in-out',
                    sidebarW,
                    // Visibility: mobile hides, desktop always shows
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0',
                    // Peek shadow when hovering collapsed sidebar
                    collapsed && hovered
                        ? 'shadow-2xl shadow-black/20 dark:shadow-black/50'
                        : '',
                ].filter(Boolean).join(' ')}
                aria-label="Sidebar navigation"
            >
                {/* ── Logo header ── */}
                <div className={[
                    'flex items-center flex-shrink-0 h-[64px] px-3 gap-3',
                    'border-b border-gray-100 dark:border-gray-800',
                    iconOnly ? 'justify-center' : 'justify-between',
                ].join(' ')}>

                    {/* Logo mark + brand name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* Gradient logo tile — primary + secondary */}
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                            style={{ background: 'linear-gradient(135deg, #3b7a8a 0%, #FF7A30 100%)' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" fill="currentColor" aria-hidden="true">
                                <path d="M12 3a9 9 0 110 18A9 9 0 0112 3zm0 2a7 7 0 100 14A7 7 0 0012 5zm-1 3h2v5h3l-4 4-4-4h3V8z" />
                            </svg>
                        </div>
                        {!iconOnly && (
                            <div className="min-w-0">
                                {/* Patrick Hand for the brand name */}
                                <p className="font-brand text-[17px] leading-tight text-gray-900 dark:text-white truncate">
                                    PhotoAdmin
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight truncate -mt-0.5">
                                    Photographer Suite
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Collapse button (only in expanded state) */}
                    {!iconOnly && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 lg:flex hidden"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeft size={15} />
                        </button>
                    )}

                    {/* Mobile close button */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 lg:hidden"
                        aria-label="Close menu"
                    >
                        <ChevronLeft size={15} />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav
                    className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-0.5"
                    aria-label="Main navigation"
                >
                    {SECTIONS.map(({ id, label, items }) => {
                        const visible = items.filter((item) => can(item.permission));
                        if (!visible.length) return null;

                        return (
                            <div key={id}>
                                {/* Section label */}
                                {iconOnly ? (
                                    <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-800" />
                                ) : (
                                    <p className="px-5 pt-4 pb-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
                                        {label}
                                    </p>
                                )}

                                {visible.map((item) => {
                                    // Collapsible items (Coming Soon pattern)
                                    if (item.collapsible) {
                                        return (
                                            <CollapsibleNavItem
                                                key={item.name}
                                                {...item}
                                                iconOnly={iconOnly}
                                            />
                                        );
                                    }
                                    return (
                                        <NavItem
                                            key={item.href}
                                            {...item}
                                            isActive={isActive(item.href)}
                                            iconOnly={iconOnly}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Quick Actions */}
                    {!iconOnly && QUICK_ACTIONS.some((a) => can(a.permission)) && (
                        <div>
                            <p className="px-5 pt-4 pb-1.5 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
                                QUICK ACTIONS
                            </p>
                            {QUICK_ACTIONS.filter((a) => can(a.permission)).map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.href}
                                        href={action.href}
                                        className="flex items-center gap-2 px-4 py-1.5 mx-2 text-xs font-medium rounded-lg text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                    >
                                        <Plus size={12} className="flex-shrink-0 text-secondary-500" />
                                        {action.name}
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom padding so last item isn't cut off */}
                    <div className="h-4" />
                </nav>

                {/* ── Sidebar footer — teal/orange accent strip ── */}
                <div className="flex-shrink-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-500" />
            </aside>

            {/* ══════════════════════════════
                MAIN CONTENT WRAPPER
            ══════════════════════════════ */}
            <div className={[
                'min-h-screen flex flex-col',
                'transition-[padding-left] duration-200 ease-in-out',
                contentPad,
            ].join(' ')}>

                {/* ── TOP BAR ── */}
                <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm shadow-black/[0.04] dark:shadow-black/20">
                    <div className="flex items-center gap-3 px-4 sm:px-6 h-[64px]">

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[36px] flex items-center"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Desktop: expand button when sidebar is collapsed */}
                        {collapsed && (
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[36px] items-center"
                                aria-label="Expand sidebar"
                            >
                                <Menu size={20} />
                            </button>
                        )}

                        {/* Page title */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate leading-tight">
                                {title ?? 'Admin Panel'}
                            </h1>
                            {subtitle && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Breadcrumbs (center, hidden on small screens) */}
                        {breadcrumbs?.length > 0 && (
                            <div className="hidden lg:flex flex-1 justify-center">
                                <Breadcrumbs crumbs={breadcrumbs} />
                            </div>
                        )}

                        {/* Right: custom actions + user profile */}
                        <div className="flex items-center gap-2 ml-auto">
                            {headerActions}

                            {/* User profile dropdown (always top-right) */}
                            <UserMenu
                                user={user}
                                role={role}
                                theme={theme}
                                onToggleTheme={toggleTheme}
                            />
                        </div>
                    </div>
                </header>

                {/* ── Page content ── */}
                <main id="main-content" className="flex-1 p-4 sm:p-6">
                    {children}
                </main>

                {/* ── Footer ── */}
                <footer className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                        &copy; {new Date().getFullYear()} PhotoAdmin &mdash; Built by Muhammad Abdullah
                    </p>
                </footer>
            </div>
        </div>
    );
}
