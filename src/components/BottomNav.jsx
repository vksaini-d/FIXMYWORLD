import React from 'react';
import { IconDashboard, IconReport, IconAnalytics } from './Icons';

export const BottomNav = ({ view, setView }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-nav px-4 py-2 flex justify-around items-center">
      <button
        onClick={() => setView('dashboard')}
        className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
          view === 'dashboard' ? 'text-emerald-400 scale-105' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <IconDashboard className={`w-6 h-6 ${view === 'dashboard' ? 'stroke-emerald-400' : 'stroke-slate-400'}`} />
        <span className="font-mono text-[10px]">Map</span>
      </button>

      <button
        onClick={() => setView('report')}
        className={`flex flex-col items-center gap-1 text-xs font-bold transition-all -translate-y-2 ${
          view === 'report' ? 'text-emerald-300' : 'text-slate-300'
        }`}
      >
        <div className="p-3 rounded-full bg-emerald-500/20 border border-emerald-400/50 backdrop-blur-md shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <IconReport className="w-6 h-6 stroke-emerald-300" />
        </div>
        <span className="text-[10px] tracking-wider uppercase font-mono">Report</span>
      </button>

      <button
        onClick={() => setView('analytics')}
        className={`flex flex-col items-center gap-1 text-xs font-bold transition-all ${
          view === 'analytics' ? 'text-emerald-400 scale-105' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <IconAnalytics className={`w-6 h-6 ${view === 'analytics' ? 'stroke-emerald-400' : 'stroke-slate-400'}`} />
        <span className="font-mono text-[10px]">Analytics</span>
      </button>
    </div>
  );
};
