import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { AIChatbot } from '../components/chatbot/AIChatbot';
import { AdminDashboard } from './dashboards/AdminDashboard';
import { SecurityGuardDashboard } from './dashboards/SecurityGuardDashboard';
import { ResidentDashboard } from './dashboards/ResidentDashboard';

export function DashboardLayout() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderDashboard = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <AdminDashboard activeTab={activeTab} />;
      case 'SECURITY_GUARD':
        return <SecurityGuardDashboard activeTab={activeTab} />;
      case 'RESIDENT':
        return <ResidentDashboard activeTab={activeTab} />;
      default:
        return <div>Unknown Role</div>;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {renderDashboard()}
        </main>
      </div>

      {/* AI Chatbot */}
      <AIChatbot />
    </div>
  );
}
