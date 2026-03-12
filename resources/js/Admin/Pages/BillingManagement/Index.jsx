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
        <AdminLayout
            title="Billing Management"
            breadcrumbs={[{ label: 'Management' }, { label: 'Billing Management' }]}
        >
            <div className="space-y-4">
                {/* Tabs: same pattern as AI Tools Analysis */}
                <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => handleTabChange(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div>
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
            </div>
        </AdminLayout>
    );
}
