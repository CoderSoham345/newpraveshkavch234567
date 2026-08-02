import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, LogOut, Camera, Wifi } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/50 backdrop-blur-md px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏢</div>
          <div>
            <h1 className="text-lg font-bold text-white">PraveshKavach™</h1>
            <p className="text-xs text-slate-400">Enterprise System</p>
          </div>
        </div>

        {/* Right: Status and User */}
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full border border-green-500/30">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium">Connected</span>
            </div>
          </div>

          {/* Camera Status */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
              <Camera className="w-4 h-4" />
              <span className="text-xs font-medium">Ready</span>
            </div>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Profile */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400 capitalize">
                  {user.role === 'SECURITY_GUARD' ? 'Security Guard' : user.role}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                {user.avatar || user.name[0]}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
