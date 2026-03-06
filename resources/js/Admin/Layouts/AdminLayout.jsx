import { useState, useEffect, useCallback } from 'react';
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
    Sun,
    Moon,
    Menu,
    X,
    Plus,
    ShieldCheck,
    Eye,
    Crown,
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
        ],
    },
];

const QUICK_ACTIONS = [
    {
        name: 'New Merchant',
        href: '/admin/merchants/create',
        icon: Plus,
        permission: 'merchants.manage',
    },
];

// ============================================================
// ROLE CONFIG
// ============================================================

const ROLE_CONFIG = {
    super_admin: {
        label: 'Super Admin',
        icon: Crown,
        cls: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50',
        iconCls: 'text-primary-600 dark:text-primary-400',
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
        cls: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50',
        iconCls: 'text-yellow-600 dark:text-yellow-400',
    },
};

// ============================================================
// PERMISSIONS HOOK
// ============================================================

function usePermissions() {
    const { props } = usePage();
    const role = props.auth?.user?.role || 'super_admin';
    const permissions = props.auth?.user?.permissions || [];

    const can = useCallback(
        (permission) => {
            if (role === 'super_admin') return true;
            if (permissions.includes('*')) return true;
            return permissions.includes(permission);
        },
        [role, permissions],
    );

    return { can, role };
}

// ============================================================
// NAV ITEM COMPONENT
// ============================================================

function NavItem({ name, href, icon: Icon, isActive, iconOnly }) {
    return (
        <Link
            href={href}
            title={iconOnly ? name : undefined}
            aria-label={iconOnly ? name : undefined}
            className={[
                'flex items-center px-3 py-2 mx-2 rounded-lg text-sm transition-colors duration-150 min-h-[36px]',
                iconOnly ? 'justify-center' : '',
                isActive
                    ? 'bg-primary-600 text-white font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800',
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Icon
                size={18}
                className={[
                    'flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500',
                    !iconOnly ? 'mr-3' : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
            />
            {!iconOnly && <span className="truncate">{name}</span>}
        </Link>
    );
}

// ============================================================
// BREADCRUMB RENDERER
// ============================================================

function Breadcrumbs({ crumbs }) {
    if (!crumbs?.length) return null;
    return (
        <nav
            className="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"
            aria-label="Breadcrumb"
        >
            <Link
                href="/admin/dashboard"
                className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
                Home
            </Link>
            {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                    <ChevronRight size={12} className="flex-shrink-0" />
                    {crumb.href ? (
                        <Link
                            href={crumb.href}
                            className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
 *   title        {string}   — Page title shown in the top bar H1
 *   subtitle     {string}   — Optional subtitle below the title
 *   breadcrumbs  {Array}    — [{label, href?}] shown in the top bar center
 *   headerActions {ReactNode} — Buttons/actions rendered in the top-bar right slot
 *   children     {ReactNode} — Page content
 */
export default function AdminLayout({
    children,
    title,
    subtitle,
    breadcrumbs,
    headerActions,
}) {
    const { url, props } = usePage();
    const { can, role } = usePermissions();

    // ---- Theme ------------------------------------------------
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const stored = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolved =
            stored === 'dark' || stored === 'light' ? stored : systemDark ? 'dark' : 'light';
        setTheme(resolved);
        if (resolved === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, []);

    const toggleTheme = useCallback(() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.add('no-transitions');
        if (next === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', next);
        setTheme(next);
        requestAnimationFrame(() =>
            requestAnimationFrame(() =>
                document.documentElement.classList.remove('no-transitions'),
            ),
        );
    }, [theme]);

    // ---- Sidebar ---------------------------------------------
    const [collapsed, setCollapsed] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setCollapsed(localStorage.getItem('sidebarCollapsed') === 'true');
    }, []);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', String(next));
            return next;
        });
        setHovered(false);
    }, []);

    // When collapsed and not hovered (and not mobile open), show icon-only
    const iconOnly = collapsed && !hovered && !mobileOpen;

    const isActive = (href) => {
        if (href === '/admin/dashboard') return url === href || url === '/admin';
        return url.startsWith(href);
    };

    // ---- User info -------------------------------------------
    const user = props.auth?.user;
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'A';
    const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.super_admin;
    const RoleIcon = roleCfg.icon;

    // Sidebar width
    const sidebarWidth = iconOnly ? 'w-[68px]' : 'w-64';
    // Main content left padding mirrors sidebar width
    const contentPadding = iconOnly ? 'lg:pl-[68px]' : 'lg:pl-64';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">

            {/* ───── MOBILE OVERLAY ───── */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ───── SIDEBAR ───── */}
            <aside
                onMouseEnter={() => collapsed && setHovered(true)}
                onMouseLeave={() => collapsed && setHovered(false)}
                className={[
                    'fixed top-0 left-0 h-screen z-40 flex flex-col',
                    'bg-white dark:bg-gray-900',
                    'border-r border-gray-200 dark:border-gray-800',
                    'transition-[width,transform,box-shadow] duration-200 ease-in-out',
                    'overflow-hidden',
                    sidebarWidth,
                    // Mobile: off-screen unless open; desktop: always visible
                    mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    'lg:translate-x-0',
                    // Elevated shadow when hovering a collapsed sidebar (peek effect)
                    collapsed && hovered
                        ? 'shadow-2xl shadow-black/15 dark:shadow-black/40'
                        : '',
                ]
                    .filter(Boolean)
                    .join(' ')}
                aria-label="Sidebar navigation"
            >
                {/* --- Logo + collapse toggle --- */}
                <div
                    className={[
                        'flex items-center h-20 flex-shrink-0 px-3',
                        'border-b border-gray-200 dark:border-gray-800',
                        iconOnly ? 'justify-center' : 'justify-between',
                    ].join(' ')}
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        {/* App logo mark */}
                        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 text-white"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                            </svg>
                        </div>
                        {!iconOnly && (
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                PhotoAdmin
                            </span>
                        )}
                    </div>

                    {/* Collapse toggle — shown when expanded */}
                    {!iconOnly && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                </div>

                {/* --- Navigation --- */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Main navigation">
                    {SECTIONS.map(({ id, label, items }) => {
                        const visible = items.filter((item) => can(item.permission));
                        if (!visible.length) return null;

                        return (
                            <div key={id} className="mb-1">
                                {/* Section header / divider */}
                                {iconOnly ? (
                                    <div className="mx-3 my-2 border-t border-gray-100 dark:border-gray-800" />
                                ) : (
                                    <div className="sidebar-section-header">{label}</div>
                                )}

                                {visible.map((item) => (
                                    <NavItem
                                        key={item.href}
                                        {...item}
                                        isActive={isActive(item.href)}
                                        iconOnly={iconOnly}
                                    />
                                ))}
                            </div>
                        );
                    })}

                    {/* Quick Actions */}
                    {!iconOnly &&
                        QUICK_ACTIONS.some((a) => can(a.permission)) && (
                            <div className="mt-2 mb-1 px-2">
                                <div className="sidebar-section-header">QUICK ACTIONS</div>
                                {QUICK_ACTIONS.filter((a) => can(a.permission)).map((action) => {
                                    const ActionIcon = action.icon;
                                    return (
                                        <Link
                                            key={action.href}
                                            href={action.href}
                                            className="sidebar-quick-action"
                                        >
                                            <ActionIcon size={14} className="mr-1.5 flex-shrink-0" />
                                            {action.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                </nav>

                {/* --- User footer --- */}
                <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-800">
                    {iconOnly ? (
                        /* Collapsed: just avatar */
                        <div className="flex justify-center">
                            <div
                                className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800"
                                title={user?.name || 'Admin'}
                            >
                                <span className="text-sm font-semibold text-white">{userInitial}</span>
                            </div>
                        </div>
                    ) : (
                        /* Expanded: full user info */
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0 ring-2 ring-primary-200 dark:ring-primary-800">
                                <span className="text-sm font-semibold text-white">{userInitial}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {user?.name || 'Admin'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email || ''}
                                </p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                                aria-label="Logout"
                            >
                                <LogOut size={18} />
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* ───── MAIN CONTENT WRAPPER ───── */}
            <div
                className={[
                    'transition-[padding] duration-200 ease-in-out min-h-screen flex flex-col',
                    contentPadding,
                ].join(' ')}
            >
                {/* ───── TOP BAR ───── */}
                <header className="top-bar">
                    <div className="top-bar-content">

                        {/* Mobile: hamburger menu */}
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden mr-4 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[36px]"
                            aria-label="Open menu"
                        >
                            <Menu size={20} />
                        </button>

                        {/* Desktop: expand sidebar button when collapsed */}
                        {collapsed && (
                            <button
                                onClick={toggleSidebar}
                                className="hidden lg:flex mr-4 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[36px] items-center"
                                aria-label="Expand sidebar"
                            >
                                <Menu size={20} />
                            </button>
                        )}

                        {/* Left: Page title + subtitle */}
                        <div className="top-bar-section min-w-0">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                                {title ?? 'Admin Panel'}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {/* Center: Breadcrumbs */}
                        {breadcrumbs?.length > 0 && (
                            <div className="top-bar-center">
                                <Breadcrumbs crumbs={breadcrumbs} />
                            </div>
                        )}

                        {/* Right: page actions + role badge + dark mode toggle */}
                        <div className="top-bar-end">
                            {headerActions}

                            {/* Role badge */}
                            <span
                                className={[
                                    'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
                                    roleCfg.cls,
                                ].join(' ')}
                            >
                                <RoleIcon size={12} className={roleCfg.iconCls} />
                                {roleCfg.label}
                            </span>

                            {/* Dark mode toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                                aria-label={
                                    theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
                                }
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* ───── PAGE CONTENT ───── */}
                <main id="main-content" className="flex-1 p-6">
                    {children}
                </main>

                {/* ───── FOOTER ───── */}
                <footer className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80">
                    <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
                        &copy; {new Date().getFullYear()} PhotoAdmin &mdash; Built by Muhammad Abdullah
                    </p>
                </footer>
            </div>
        </div>
    );
}
