import React from 'react';
import { BarChart3, Users, Building2, Shield, FileText, Settings, Zap, Clock } from 'lucide-react';

interface AdminDashboardProps {
  activeTab: string;
}

export function AdminDashboard({ activeTab }: AdminDashboardProps) {
  const stats = [
    { icon: Users, label: 'Total Residents', value: '1,247', change: '+12%' },
    { icon: Building2, label: 'Buildings', value: '23', change: '+2' },
    { icon: Shield, label: 'Security Guards', value: '48', change: '↔' },
    { icon: FileText, label: 'Visitor Logs', value: '5,432', change: '+23%' },
  ];

  const modules = [
    { icon: Users, label: 'Residents', desc: 'Manage resident profiles' },
    { icon: Building2, label: 'Buildings', desc: 'Configure towers & flats' },
    { icon: Shield, label: 'Security Guards', desc: 'Guard assignments & roles' },
    { icon: FileText, label: 'Visitor Logs', desc: 'Complete audit trail' },
    { icon: BarChart3, label: 'Analytics', desc: 'System statistics & trends' },
    { icon: Settings, label: 'Settings', desc: 'System configuration' },
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-slate-400">Complete system overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded">{stat.change}</span>
                </div>
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Access */}
        <div>
          <h2 className="text-xl font-bold mb-4">Administrative Modules</h2>
          <div className="grid grid-cols-3 gap-4">
            {modules.map((module, i) => {
              const Icon = module.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer group">
                  <Icon className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition" />
                  <h3 className="font-semibold mb-1 group-hover:text-cyan-300 transition">{module.label}</h3>
                  <p className="text-sm text-slate-400">{module.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'residents') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Residents Management</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Resident directory with profile management coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'buildings') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Buildings & Properties</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Building configuration and tower management coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'guards') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Security Guards</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Guard assignment and role management coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'visitor-logs') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Visitor Logs</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Complete audit trail and visitor history coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'analytics') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Analytics & Reports</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <BarChart3 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">System analytics and reporting dashboard coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'settings') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">System Settings</h1>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <Zap className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">OCR Configuration</h3>
            <p className="text-sm text-slate-400 mb-4">Manage OCR.Space API settings</p>
            <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium transition">
              Configure
            </button>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <Settings className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">Telegram Bot</h3>
            <p className="text-sm text-slate-400 mb-4">Setup Telegram integration</p>
            <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm font-medium transition">
              Configure
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <p className="text-slate-400">Tab content for: {activeTab}</p>
    </div>
  );
}
