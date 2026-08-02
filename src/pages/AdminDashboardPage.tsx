import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { MobileFrame } from '../components/MobileFrame';
import { ReportsAnalytics } from '../components/ReportsAnalytics';
import { AdminSettings } from '../components/AdminSettings';
import { AIChatbot } from '../components/chatbot/AIChatbot';
import { BarChart3, Users, Building2, Shield, FileText, Settings, Activity, AlertTriangle } from 'lucide-react';
import { AnalyticsStats, SystemBuilding, AuditLogItem, VisitorRecord } from '../types';

export function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'settings'>('dashboard');
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalVisitorsToday: 0,
    currentlyInside: 0,
    pendingApprovals: 0,
    rejectedVisitorsToday: 0,
    avgVerificationTimeSec: 0,
    peakHour: '',
    weeklyTrends: [],
    hourlyTraffic: [],
    purposeBreakdown: [],
  });

  const [buildings, setBuildings] = useState<SystemBuilding[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    ocrConfigured: false,
    telegramConfigured: false,
    databaseConnected: false,
  });

  // Fetch data on mount
  useEffect(() => {
    console.log('[v0] AdminDashboard mounted - admin:', user?.name);

    // Fetch analytics
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch analytics:', err));

    // Fetch buildings
    fetch('/api/buildings')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.buildings)) {
          setBuildings(data.buildings);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch buildings:', err));

    // Fetch audit logs
    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.logs)) {
          setAuditLogs(data.logs);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch audit logs:', err));

    // Fetch system status
    fetch('/api/admin/system-status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.systemStatus) {
          setSystemStatus({
            ocrConfigured: data.systemStatus.ocr?.configured || false,
            telegramConfigured: data.systemStatus.telegram?.configured || false,
            databaseConnected: true,
          });
        }
      })
      .catch(err => console.error('[v0] Failed to fetch system status:', err));
  }, [user]);

  // Update sync clock
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { icon: Users, label: 'Total Residents', value: '1,247', change: '+12%', color: 'text-blue-400' },
    { icon: Building2, label: 'Buildings', value: buildings.length, change: '↔', color: 'text-cyan-400' },
    { icon: Shield, label: 'Security Guards', value: '48', change: '↔', color: 'text-green-400' },
    { icon: FileText, label: 'Visitor Logs', value: '5,432', change: '+23%', color: 'text-purple-400' },
  ];

  const statusItems = [
    { name: 'OCR.Space API', status: systemStatus.ocrConfigured ? 'Active' : 'Inactive', icon: BarChart3 },
    { name: 'Telegram Bot', status: systemStatus.telegramConfigured ? 'Active' : 'Inactive', icon: Activity },
    { name: 'Database', status: systemStatus.databaseConnected ? 'Connected' : 'Disconnected', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentRole="ADMIN"
        setCurrentRole={() => {}}
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
        pendingApprovalsCount={0}
        cameraActive={false}
        syncTime={syncTime}
        onNavigateHome={() => setActiveTab('dashboard')}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={0}
      />

      <main className="flex-1">
        <MobileFrame isMobileView={isMobileView}>
          {activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                <p className="text-slate-400">System overview and management</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                        <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">{stat.change}</span>
                      </div>
                      <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* System Status */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">System Integration Status</h2>
                <div className="grid grid-cols-3 gap-4">
                  {statusItems.map((item, i) => {
                    const Icon = item.icon;
                    const isActive = item.status === 'Active' || item.status === 'Connected';
                    return (
                      <div key={i} className={`border rounded-lg p-4 ${isActive ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-red-400'}`} />
                          <span className="font-semibold">{item.name}</span>
                        </div>
                        <p className={`text-sm ${isActive ? 'text-green-300' : 'text-red-300'}`}>{item.status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Management */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
                  <Users className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold mb-2">Residents</h3>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-slate-400 mt-2">Manage resident profiles</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
                  <Building2 className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold mb-2">Buildings</h3>
                  <p className="text-2xl font-bold">{buildings.length}</p>
                  <p className="text-xs text-slate-400 mt-2">Configure towers & flats</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
                  <Shield className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold mb-2">Security Guards</h3>
                  <p className="text-2xl font-bold">48</p>
                  <p className="text-xs text-slate-400 mt-2">Guard assignments & roles</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <ReportsAnalytics stats={analytics} />
          )}

          {activeTab === 'settings' && (
            <AdminSettings buildings={buildings} auditLogs={auditLogs} />
          )}
        </MobileFrame>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <p>PraveshKavach™ Admin Portal | System Health: All Systems Operational</p>
      </footer>

      <AIChatbot currentPage={activeTab} currentRole="ADMIN" />
    </div>
  );
}
