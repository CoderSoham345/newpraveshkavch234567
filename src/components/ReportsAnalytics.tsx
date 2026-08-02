import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  Clock, 
  Users, 
  ShieldCheck, 
  FileSpreadsheet,
  PieChart,
  Activity
} from 'lucide-react';
import { AnalyticsStats } from '../types';

interface ReportsAnalyticsProps {
  stats: AnalyticsStats;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ stats }) => {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Gate Visitor Analytics & Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise analytics on peak gate hours, visitor volume, approval speed, and purpose breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex text-xs font-semibold">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'daily' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'weekly' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'monthly' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Volume</span>
          <p className="text-2xl font-black text-white">{stats.totalVisitorsToday} Visitors</p>
          <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18% peak volume
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Peak Gate Hour</span>
          <p className="text-xl font-black text-amber-400">{stats.peakHour}</p>
          <span className="text-[11px] text-slate-400">26 visitors/hr max</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Avg Verification Speed</span>
          <p className="text-2xl font-black text-cyan-400">{stats.avgVerificationTimeSec} Seconds</p>
          <span className="text-[11px] text-cyan-300 font-bold">AI Vision Edge OCR</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase">Approval Rate</span>
          <p className="text-2xl font-black text-emerald-400">95.8%</p>
          <span className="text-[11px] text-slate-400">2 Rejections today</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Weekly Visitor Trends Bar Chart */}
        <div className="lg:col-span-8 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Visitor Traffic Volume ({timeRange.toUpperCase()})</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Total Approved vs Rejected</span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2">
            {stats.weeklyTrends.map((t, idx) => {
              const maxVal = 100;
              const heightPct = (t.count / maxVal) * 100;
              const approvedPct = (t.approved / t.count) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-bold text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {t.count}
                  </div>
                  <div className="w-full bg-slate-950 rounded-t-lg h-48 flex items-end p-1 border border-slate-800">
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-400">{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Purpose Breakdown */}
        <div className="lg:col-span-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <PieChart className="w-4 h-4 text-amber-400" />
            <span>Visitor Purpose Share</span>
          </h3>

          <div className="space-y-3 pt-2">
            {stats.purposeBreakdown.map((p, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-200">{p.purpose}</span>
                  <span className="text-cyan-400">{p.percentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      idx === 0 
                        ? 'bg-cyan-400' 
                        : idx === 1 
                        ? 'bg-emerald-400' 
                        : idx === 2 
                        ? 'bg-amber-400' 
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${p.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
