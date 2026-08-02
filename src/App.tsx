import React, { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SecurityGuardWorkflow } from './pages/SecurityGuardWorkflow';
import { ResidentDashboardPage } from './pages/ResidentDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export default function App() {
  const { isAuthenticated, user, isInitialized, isLoading } = useAuth();

  // Still initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Initializing...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login
  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  console.log('[v0] App routing - user role:', user.role);

  // Route based on role
  switch (user.role) {
    case 'SECURITY_GUARD':
      return <SecurityGuardWorkflow />;
    
    case 'RESIDENT':
      return <ResidentDashboardPage />;
    
    case 'ADMIN':
      return <AdminDashboardPage />;
    
    default:
      return <LoginPage />;
  }
}
