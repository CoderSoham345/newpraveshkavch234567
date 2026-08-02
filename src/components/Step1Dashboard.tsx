import React from 'react';
import { 
  ShieldCheck, 
  Camera, 
  UserCheck, 
  Clock, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings, 
  QrCode, 
  FileCheck2, 
  ArrowRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { AnalyticsStats, VisitorRecord, UserRole } from '../types';

interface Step1DashboardProps {
  stats: AnalyticsStats;
  recentVisitors: VisitorRecord[];
  currentRole: UserRole;
  onStartVerification: () => void;
  onNavigateTab: (tab: 'scanner' | 'history' | 'residents' | 'reports' | 'admin') => void;
}

export const Step1Dashboard: React.FC<Step1DashboardProps> = ({
  stats,
  recentVisitors,
  currentRole,
  onStartVerification,
  onNavigateTab,
}) => {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/20 p-6 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Gate Security Portal
              </span>
              <span className="text-xs text-slate-400">Active Gate: Main Gate 01</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good Morning, <span className="text-cyan-400">{currentRole.replace('_', ' ')}</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              AI-Powered Visitor Verification system ready. Scan front/back ID cards, perform face match verification, and request instant resident approvals.
            </p>
          </div>

          <button
            onClick={onStartVerification}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            id="btn-start-verification-main"
          >
            <Camera className="w-5 h-5 text-cyan-200" />
            <span>START VERIFICATION WORKFLOW</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>

      {/* Quick Action Grid (6 Buttons as reference layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <button
          onClick={onStartVerification}
          className="p-4 rounded-xl bg-slate-900 border border-blue-500/30 hover:border-cyan-400/60 bg-gradient-to-b from-blue-950/40 to-slate-900 text-left group transition-all hover:shadow-lg hover:shadow-blue-500/10"
          id="quick-act-scan-doc"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">SCAN DOCUMENT</p>
          <p className="text-xs text-slate-400 mt-0.5">Select ID & Auto Scan</p>
        </button>

        <button
          onClick={onStartVerification}
          className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400/60 bg-gradient-to-b from-emerald-950/40 to-slate-900 text-left group transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          id="quick-act-live-photo"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">LIVE PHOTO</p>
          <p className="text-xs text-slate-400 mt-0.5">Capture Visitor Face</p>
        </button>

        <button
          onClick={() => onNavigateTab('history')}
          className="p-4 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-400/60 bg-gradient-to-b from-purple-950/40 to-slate-900 text-left group transition-all hover:shadow-lg hover:shadow-purple-500/10"
          id="quick-act-visitor-history"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">VISITOR HISTORY</p>
          <p className="text-xs text-slate-400 mt-0.5">View All Logs</p>
        </button>

        <button
          onClick={() => onNavigateTab('residents')}
          className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400/60 bg-gradient-to-b from-amber-950/40 to-slate-900 text-left group transition-all hover:shadow-lg hover:shadow-amber-500/10"
          id="quick-act-search-residents"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">RESIDENTS</p>
          <p className="text-xs text-slate-400 mt-0.5">Search Directory</p>
        </button>

        <button
          onClick={() => onNavigateTab('reports')}
          className="p-4 rounded-xl bg-slate-900 border border-indigo-500/30 hover:border-indigo-400/60 bg-gradient-to-b from-indigo-950/40 to-slate-900 text-left group transition-all hover:shadow-lg hover:shadow-indigo-500/10"
          id="quick-act-reports"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
            <BarChart3 className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">REPORTS</p>
          <p className="text-xs text-slate-400 mt-0.5">Daily / Monthly</p>
        </button>

        <button
          onClick={() => onNavigateTab('admin')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 bg-gradient-to-b from-slate-900 to-slate-950 text-left group transition-all"
          id="quick-act-settings"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 mb-3 group-hover:scale-110 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <p className="font-bold text-sm text-white">SETTINGS</p>
          <p className="text-xs text-slate-400 mt-0.5">App Configuration</p>
        </button>

      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visitors Today</p>
            <p className="text-2xl font-extrabold text-white mt-1">{stats.totalVisitorsToday}</p>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> +14% vs yesterday
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Currently Inside</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.currentlyInside}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Active Passes</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">{stats.pendingApprovals}</p>
            <span className="text-[11px] text-amber-400/80 font-medium mt-1 block">Awaiting Resident</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Verification</p>
            <p className="text-2xl font-extrabold text-cyan-400 mt-1">{stats.avgVerificationTimeSec}s</p>
            <span className="text-[11px] text-cyan-300/80 font-medium mt-1 block">AI Vision OCR Speed</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Recent Activity Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-cyan-400" />
              <span>Recent Gate Activity & Passes</span>
            </h2>
            <p className="text-xs text-slate-400">Live feed of visitor verifications and entry statuses</p>
          </div>

          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span>View Full Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="pb-3 font-semibold">Visitor</th>
                <th className="pb-3 font-semibold">ID Type</th>
                <th className="pb-3 font-semibold">Resident / Unit</th>
                <th className="pb-3 font-semibold">Purpose</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {recentVisitors.slice(0, 5).map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2.5">
                      {visitor.liveFaceUrl ? (
                        <img 
                          src={visitor.liveFaceUrl} 
                          alt={visitor.visitorName} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-700" 
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400">
                          {visitor.visitorName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white text-xs">{visitor.visitorName}</p>
                        <p className="text-[11px] text-slate-400">{visitor.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 font-medium text-slate-300">{visitor.documentType}</td>
                  <td className="py-3">
                    <p className="font-semibold text-slate-200">{visitor.residentName}</p>
                    <p className="text-[11px] text-slate-400">{visitor.buildingUnit}</p>
                  </td>
                  <td className="py-3 font-medium text-slate-300">{visitor.purpose}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      visitor.status === 'APPROVED' || visitor.status === 'CHECKED_IN'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : visitor.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {visitor.status === 'APPROVED' || visitor.status === 'CHECKED_IN' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : visitor.status === 'PENDING' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      <span>{visitor.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-right text-slate-400 font-mono text-[11px]">
                    {new Date(visitor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
