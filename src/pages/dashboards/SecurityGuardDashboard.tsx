import React from 'react';
import { Camera, CheckCircle2, Clock, FileText, AlertTriangle, Search } from 'lucide-react';

interface SecurityGuardDashboardProps {
  activeTab: string;
}

export function SecurityGuardDashboard({ activeTab }: SecurityGuardDashboardProps) {
  const stats = [
    { icon: Clock, label: 'Pending', value: '3', color: 'text-yellow-400' },
    { icon: CheckCircle2, label: 'Approved Today', value: '24', color: 'text-green-400' },
    { icon: FileText, label: 'Total Scanned', value: '47', color: 'text-blue-400' },
    { icon: AlertTriangle, label: 'Alerts', value: '1', color: 'text-red-400' },
  ];

  if (activeTab === 'dashboard') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Security Guard Dashboard</h1>
          <p className="text-slate-400">Visitor management and document verification</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-6">
                <Icon className={`w-6 h-6 ${stat.color} mb-3`} />
                <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
            <Camera className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">Scan Document</h3>
            <p className="text-sm text-slate-400">Start new visitor verification</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
            <CheckCircle2 className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">Pending Approvals</h3>
            <p className="text-sm text-slate-400">Review visitor requests</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
            <Search className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">Search Resident</h3>
            <p className="text-sm text-slate-400">Find resident details</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-cyan-400/50 hover:bg-white/10 transition cursor-pointer">
            <AlertTriangle className="w-8 h-8 text-cyan-400 mb-3" />
            <h3 className="font-semibold mb-2">Emergency</h3>
            <p className="text-sm text-slate-400">Trigger emergency protocol</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'scan') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Scan Documents</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Document scanner coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'approvals') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Visitor Approvals</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Pending visitor approvals coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'search') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Search Resident</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Search className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Resident search coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'emergency') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Emergency Protocol</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Emergency procedures coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'logs') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Visitor Logs</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Visitor history and logs coming soon</p>
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
