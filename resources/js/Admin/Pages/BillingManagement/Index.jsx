import { useState, useEffect } from 'react';
import AdminLayout from '@/Admin/Layouts/AdminLayout';
import { usePage } from '@inertiajs/react';
import { CreditCard, BarChart3, Package } from 'lucide-react';
import AnalysisTab from './AnalysisTab';
import PlansTab from './PlansTab';
import CreditPacksTab from './CreditPacksTab';

const TABS = [
    { key: 'analysis', label: 'Analysis', icon: BarChart3 },
    { key: 'plans', label: 'Plans', icon: CreditCard },
    { key: 'credit-packs', label: 'Credit Packs', icon: Package },
];

export default function BillingManagementIndex() {
    const { 
        plans = [], 
        stats = {}, 
        creditPacks = [], 
        creditStats = {},
        analytics = {},
        initialTab = 'analysis'
    } = usePage().props;

    const [activeTab, setActiveTab] = useState(() => {
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        return params.get('tab') || initialTab;
    });

    const pageUrl = usePage().url;

    useEffect(() => {
        const u = new URL(pageUrl, window.location.origin);
        const t = u.searchParams.get('tab');
        if (t && ['analysis', 'plans', 'credit-packs'].includes(t)) {
            setActiveTab(t);
        }
    }, [pageUrl]);

    const handleTabChange = (key) => {
        setActiveTab(key);
        const u = new URL(window.location);
        u.searchParams.set('tab', key);
        window.history.pushState({}, '', u);
    };

    return (
        <>
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billing Management</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage subscription plans, credit packs, and view analytics
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-6">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`
                                    flex items-center gap-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors
                                    ${isActive
                                        ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                    }
                                `}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pb-8">
                {activeTab === 'analysis' && (
                    <AnalysisTab 
                        plans={plans}
                        creditPacks={creditPacks}
                        analytics={analytics}
                    />
                )}
                {activeTab === 'plans' && (
                    <PlansTab 
                        plans={plans}
                        stats={stats}
                    />
                )}
                {activeTab === 'credit-packs' && (
                    <CreditPacksTab 
                        creditPacks={creditPacks}
                        stats={creditStats}
                    />
                )}
            </div>
        </>
    );
}

BillingManagementIndex.layout = (page) => (
    <AdminLayout children={page} title="Billing Management" />
);
