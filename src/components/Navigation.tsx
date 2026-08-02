import React from 'react';
import { 
  LayoutDashboard, 
  QrCode, 
  Clock, 
  Users, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface NavigationProps {
  activeTab: 'scanner' | 'dashboard' | 'history' | 'residents' | 'reports' | 'admin';
  setActiveTab: (tab: 'scanner' | 'dashboard' | 'history' | 'residents' | 'reports' | 'admin') => void;
  pendingCount: number;
}

interface TabItem {
  id: 'scanner' | 'dashboard' | 'history' | 'residents' | 'reports' | 'admin';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, pendingCount }) => {
  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'scanner', label: 'Scanner Workflow', icon: QrCode },
    { id: 'history', label: 'Visitor Logs', icon: Clock, badge: pendingCount },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
    { id: 'admin', label: 'Admin', icon: Settings },
  ];

  return (
    <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                id={`nav-tab-${tab.id}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge && tab.badge > 0 ? (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center ml-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
