import React from 'react';
import { 
  Shield, 
  Camera, 
  CheckCircle2, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  Bell, 
  UserCheck, 
  ChevronDown,
  Building,
  KeyRound,
  Send as TelegramIcon
} from 'lucide-react';
import { UserRole } from '../types';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
  pendingApprovalsCount: number;
  cameraActive: boolean;
  syncTime: string;
  onNavigateHome: () => void;
  onOpenTelegramChat?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  isMobileView,
  setIsMobileView,
  pendingApprovalsCount,
  cameraActive,
  syncTime,
  onNavigateHome,
  onOpenTelegramChat,
}) => {
  const roles: { value: UserRole; label: string; icon: string }[] = [
    { value: 'SECURITY_GUARD', label: 'Security Guard', icon: '🛡️' },
    { value: 'RESIDENT', label: 'Resident / Host', icon: '🏠' },
    { value: 'ADMIN', label: 'System Admin', icon: '⚙️' },
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div 
          onClick={onNavigateHome}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-95 transition-opacity"
          id="app-brand-logo"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                Pravesh<span className="text-cyan-400 font-extrabold">Kavach™</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                Enterprise v4.2
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              High Tech Surveillance Systems Pvt. Ltd.
            </p>
          </div>
        </div>

        {/* Center / Status Indicators */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          {/* Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium">Connected</span>
            <span className="text-slate-500">({syncTime})</span>
          </div>

          {/* Camera Status */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
            cameraActive 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
              : 'bg-slate-800/40 border-slate-700 text-slate-400'
          }`}>
            <Camera className="w-3.5 h-3.5" />
            <span>{cameraActive ? 'Camera Ready' : 'Camera Idle'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Telegram Resident Live Chat Button */}
          {onOpenTelegramChat && (
            <button
              onClick={onOpenTelegramChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all shadow-sm"
              title="Open Resident Telegram Live Chat"
              id="btn-open-telegram-chat"
            >
              <TelegramIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Telegram Chat</span>
            </button>
          )}

          {/* Pending Approvals Badge */}
          {pendingApprovalsCount > 0 && (
            <div className="relative flex items-center px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-pulse">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              <span>{pendingApprovalsCount} Pending</span>
            </div>
          )}

          {/* Mobile / Native Expo Mode Toggle */}
          <button
            onClick={() => setIsMobileView(!isMobileView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isMobileView
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Native Expo Mobile App Simulator Frame"
            id="btn-toggle-mobile-view"
          >
            {isMobileView ? <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> : <Monitor className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isMobileView ? 'Expo Mobile Mode' : 'Web App Mode'}</span>
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative group" id="role-selector-dropdown">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-white text-xs font-semibold cursor-pointer hover:border-blue-400 transition-colors">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{roles.find((r) => r.value === currentRole)?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 hidden group-hover:block z-50">
              <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Portal Role
              </div>
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setCurrentRole(r.value)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors ${
                    currentRole === r.value
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  id={`role-opt-${r.value.toLowerCase()}`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
