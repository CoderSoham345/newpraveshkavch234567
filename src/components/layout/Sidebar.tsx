import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  FileText,
  Settings,
  BarChart3,
  MessageSquare,
  User,
  CheckCircle2,
  Camera,
  AlertTriangle,
  Search,
} from 'lucide-react';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user } = useAuth();

  const getMenuItems = (): NavItem[] => {
    const baseItems: Record<string, NavItem[]> = {
      ADMIN: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', href: 'dashboard' },
        { icon: <Users className="w-5 h-5" />, label: 'Residents', href: 'residents' },
        { icon: <Building2 className="w-5 h-5" />, label: 'Buildings', href: 'buildings' },
        { icon: <Shield className="w-5 h-5" />, label: 'Security Guards', href: 'guards' },
        { icon: <FileText className="w-5 h-5" />, label: 'Visitor Logs', href: 'visitor-logs' },
        { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', href: 'analytics' },
        { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: 'settings' },
      ],
      SECURITY_GUARD: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', href: 'dashboard' },
        { icon: <Camera className="w-5 h-5" />, label: 'Scan Documents', href: 'scan' },
        { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Approvals', href: 'approvals' },
        { icon: <Search className="w-5 h-5" />, label: 'Search Resident', href: 'search' },
        { icon: <AlertTriangle className="w-5 h-5" />, label: 'Emergency', href: 'emergency' },
        { icon: <FileText className="w-5 h-5" />, label: 'Visitor Logs', href: 'logs' },
      ],
      RESIDENT: [
        { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Home', href: 'home' },
        { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Pending Approvals', href: 'approvals' },
        { icon: <Users className="w-5 h-5" />, label: 'Family Members', href: 'family' },
        { icon: <FileText className="w-5 h-5" />, label: 'Visitor History', href: 'history' },
        { icon: <AlertTriangle className="w-5 h-5" />, label: 'Emergency', href: 'emergency' },
        { icon: <User className="w-5 h-5" />, label: 'Profile', href: 'profile' },
      ],
    };

    return baseItems[user?.role || 'RESIDENT'] || [];
  };

  const roleColors = {
    ADMIN: 'from-blue-600 to-blue-700',
    SECURITY_GUARD: 'from-green-600 to-green-700',
    RESIDENT: 'from-purple-600 to-purple-700',
  };

  const roleLabels = {
    ADMIN: 'Administrator',
    SECURITY_GUARD: 'Security Guard',
    RESIDENT: 'Resident',
  };

  const menuItems = getMenuItems();
  const bgGradient = roleColors[user?.role || 'RESIDENT'];
  const roleLabel = roleLabels[user?.role || 'RESIDENT'];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-700/50 flex flex-col h-screen">
      {/* Role Badge */}
      <div className={`bg-gradient-to-r ${bgGradient} p-4 m-4 rounded-lg text-center`}>
        <p className="text-white text-sm font-semibold">{roleLabel}</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.href}
            onClick={() => onTabChange(item.href)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === item.href
                ? 'bg-white/10 text-cyan-400 border border-cyan-400/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* AI Assistant Info */}
      <div className="px-4 py-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-300">
            💬 <span className="font-semibold text-cyan-300">AI Assistant</span> available
          </p>
          <p className="text-xs text-slate-400 mt-1">Click the chat button for help</p>
        </div>
      </div>
    </aside>
  );
}
