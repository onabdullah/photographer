/**
 * All system permissions, grouped by category.
 * Keys are the slugs used in role.permissions arrays.
 * Values are human-readable labels shown in the UI.
 */
export const ALL_PERMISSIONS = {
    'DASHBOARD': {
        'dashboard.view':    'Dashboard View',
    },
    'MERCHANTS': {
        'merchants.view':    'Merchants View',
        'merchants.manage':  'Merchants Manage',
    },
    'PRODUCTS': {
        'products.view':     'Products View',
        'products.manage':   'Products Manage',
    },
    'AI PROCESSING': {
        'ai.view':           'AI View',
        'ai.manage':         'AI Manage',
    },
    'ANALYTICS': {
        'analytics.view':    'Analytics View',
    },
    'FINANCE': {
        'finance.view':      'Finance View',
    },
    'USERS': {
        'users.view':        'Users View',
        'users.manage':      'Users Manage',
    },
    'ROLES': {
        'roles.view':        'Roles View',
        'roles.manage':      'Roles Manage',
    },
    'SYSTEM SETTINGS': {
        'settings.view':     'Settings View',
        'settings.manage':   'Settings Manage',
    },
    'DEVELOPER': {
        'developer.terminal': 'Artisan Terminal',
    },
};

export const ALL_PERMISSION_KEYS = Object.values(ALL_PERMISSIONS)
    .flatMap((group) => Object.keys(group));

export const TOTAL_PERMISSIONS = ALL_PERMISSION_KEYS.length;
