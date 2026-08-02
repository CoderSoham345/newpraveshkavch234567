import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  isMobileView: boolean;
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ isMobileView, children }) => {
  if (!isMobileView) {
    return <>{children}</>;
  }

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="py-6 px-2 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950/80">
      <div className="text-center mb-3">
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-500/30 px-3 py-1 rounded-full">
          📱 React Native & Expo Mobile Simulator
        </span>
        <p className="text-xs text-slate-400 mt-1">
          Testing native mobile camera controls, gestures & touch targets
        </p>
      </div>

      {/* iPhone / Android Device Shell */}
      <div className="w-full max-w-[410px] h-[820px] bg-slate-900 rounded-[50px] p-3 border-[6px] border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden ring-1 ring-slate-700/50">
        
        {/* Dynamic Island / Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-between px-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-blue-950 border border-blue-800 animate-pulse"></div>
        </div>

        {/* Status Bar */}
        <div className="pt-2 px-6 pb-2 flex items-center justify-between text-slate-300 text-xs font-medium z-40 bg-slate-950 select-none">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3 h-3 text-cyan-400" />
            <Wifi className="w-3 h-3 text-cyan-400" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-bold text-emerald-400">100%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Mobile Viewport Canvas */}
        <div className="flex-1 bg-slate-950 rounded-[38px] overflow-y-auto overflow-x-hidden text-slate-100 flex flex-col custom-scrollbar">
          {children}
        </div>

        {/* Home Bar Indicator */}
        <div className="py-2 bg-slate-950 flex items-center justify-center">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>

      </div>
    </div>
  );
};
