import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { MobileFrame } from '../components/MobileFrame';
import { VisitorHistory } from '../components/VisitorHistory';
import { ReportsAnalytics } from '../components/ReportsAnalytics';
import { AdminSettings } from '../components/AdminSettings';
import { AIChatbot } from '../components/chatbot/AIChatbot';
import { CheckCircle2, FileText, Users, Car, Bell, Clock, X } from 'lucide-react';
import { VisitorRecord, AnalyticsStats } from '../types';

export function ResidentDashboardPage() {
  const { user, logout } = useAuth();
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [syncTime, setSyncTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  
  const [pendingApprovals, setPendingApprovals] = useState<VisitorRecord[]>([]);
  const [visitorHistory, setVisitorHistory] = useState<VisitorRecord[]>([]);
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

  // Fetch data on mount
  useEffect(() => {
    console.log('[v0] ResidentDashboard mounted - resident:', user?.name, 'flat:', user?.flatNumber);

    // Fetch visitors for this resident
    fetch(`/api/residents/${user?.id}/visitors`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.visitors)) {
          const pending = data.visitors.filter((v: VisitorRecord) => v.status === 'PENDING');
          const history = data.visitors;
          setPendingApprovals(pending);
          setVisitorHistory(history);
        }
      })
      .catch(err => console.error('[v0] Failed to fetch visitors:', err));
  }, [user]);

  // Update sync clock
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (visitorId: string) => {
    try {
      const res = await fetch(`/api/visitors/${visitorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingApprovals(prev => prev.filter(v => v.id !== visitorId));
        setVisitorHistory(prev => prev.map(v => v.id === visitorId ? data.visitor : v));
      }
    } catch (err) {
      console.error('[v0] Approval error:', err);
    }
  };

  const handleReject = async (visitorId: string, reason: string) => {
    try {
      const res = await fetch(`/api/visitors/${visitorId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', rejectionReason: reason }),
      });
      const data = await res.json();
      if (data.success) {
        setPendingApprovals(prev => prev.filter(v => v.id !== visitorId));
        setVisitorHistory(prev => prev.map(v => v.id === visitorId ? data.visitor : v));
      }
    } catch (err) {
      console.error('[v0] Rejection error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        currentRole="RESIDENT"
        setCurrentRole={() => {}}
        isMobileView={isMobileView}
        setIsMobileView={setIsMobileView}
        pendingApprovalsCount={pendingApprovals.length}
        cameraActive={false}
        syncTime={syncTime}
        onNavigateHome={() => setActiveTab('dashboard')}
      />

      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={pendingApprovals.length}
      />

      <main className="flex-1">
        <MobileFrame isMobileView={isMobileView}>
          {activeTab === 'dashboard' && (
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
                <p className="text-slate-400">Flat {user?.flatNumber} • Manage your visitors</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <CheckCircle2 className="w-6 h-6 text-yellow-400 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">Pending Approvals</p>
                  <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <FileText className="w-6 h-6 text-blue-400 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">Total Visitors</p>
                  <p className="text-2xl font-bold">{visitorHistory.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <Users className="w-6 h-6 text-green-400 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">Inside Now</p>
                  <p className="text-2xl font-bold">{visitorHistory.filter(v => v.status === 'CHECKED_IN').length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <Bell className="w-6 h-6 text-purple-400 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">Notifications</p>
                  <p className="text-2xl font-bold">{pendingApprovals.length}</p>
                </div>
              </div>

              {/* Pending Approvals */}
              {pendingApprovals.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
                  <div className="space-y-3">
                    {pendingApprovals.map(visitor => (
                      <div key={visitor.id} className="bg-white/5 border border-yellow-500/30 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold">{visitor.visitorName}</p>
                            <p className="text-sm text-slate-400">{visitor.purpose}</p>
                            <p className="text-xs text-slate-500">Doc: {visitor.documentType}</p>
                          </div>
                          <Clock className="w-5 h-5 text-yellow-400" />
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApprove(visitor.id)}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 px-3 py-2 rounded text-sm font-medium transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(visitor.id, 'Rejected by resident')}
                            className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 px-3 py-2 rounded text-sm font-medium transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <Users className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold mb-2">Family Members</h3>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-slate-400 mt-2">Add or manage family members</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <Car className="w-8 h-8 text-cyan-400 mb-3" />
                  <h3 className="font-semibold mb-2">Vehicles</h3>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-xs text-slate-400 mt-2">Register or update vehicles</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <VisitorHistory
              visitors={visitorHistory}
              onSelectVisitor={() => {}}
              onUpdateStatus={() => {}}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettings buildings={[]} auditLogs={[]} />
          )}
        </MobileFrame>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
        <p>PraveshKavach™ | Resident Portal | Flat {user?.flatNumber}</p>
      </footer>

      <AIChatbot currentPage={activeTab} currentRole="RESIDENT" />
    </div>
  );
}
