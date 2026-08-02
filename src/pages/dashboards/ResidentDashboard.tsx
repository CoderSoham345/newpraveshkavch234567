import React from 'react';
import { CheckCircle2, Users, Car, Bell, User, FileText, AlertTriangle } from 'lucide-react';

interface ResidentDashboardProps {
  activeTab: string;
}

export function ResidentDashboard({ activeTab }: ResidentDashboardProps) {
  const stats = [
    { icon: CheckCircle2, label: 'Pending Approvals', value: '2', color: 'text-yellow-400' },
    { icon: FileText, label: 'Visitor History', value: '12', color: 'text-blue-400' },
    { icon: Users, label: 'Family Members', value: '4', color: 'text-green-400' },
    { icon: Car, label: 'Registered Vehicles', value: '2', color: 'text-purple-400' },
  ];

  if (activeTab === 'home') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Home</h1>
          <p className="text-slate-400">Manage your visitors and property access</p>
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
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-400/50 hover:bg-white/10 transition cursor-pointer">
            <CheckCircle2 className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Pending Approvals</h3>
            <p className="text-sm text-slate-400">Review visitor requests</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-400/50 hover:bg-white/10 transition cursor-pointer">
            <FileText className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Visitor History</h3>
            <p className="text-sm text-slate-400">View past visits</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-400/50 hover:bg-white/10 transition cursor-pointer">
            <Users className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Family Members</h3>
            <p className="text-sm text-slate-400">Manage household</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-400/50 hover:bg-white/10 transition cursor-pointer">
            <User className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">My Profile</h3>
            <p className="text-sm text-slate-400">Update information</p>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === 'approvals') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Pending Visitor Approvals</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Pending visitor approvals coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'family') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Family Members</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Family member management coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'history') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Visitor History</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Historical visitor records coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'emergency') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Emergency Contacts</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Emergency contacts coming soon</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'profile') {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">My Profile</h1>
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center">
          <User className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">Profile management coming soon</p>
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
