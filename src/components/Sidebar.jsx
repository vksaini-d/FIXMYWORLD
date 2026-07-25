import React from 'react';
import { IconDashboard, IconAnalytics, IconReport } from './Icons';

const NavItem = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`group flex w-full items-center space-x-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300 ${
            isActive
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] scale-[1.02]'
                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
    >
        <span className={isActive ? 'text-emerald-300' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'}>
            {icon}
        </span>
        <span>{label}</span>
    </button>
);

export const Sidebar = ({ user, userName, onNameChange, view, setView, selectedIssueId, setSelectedIssueId, isMobileMenuOpen, setIsMobileMenuOpen, handleLogout }) => {
    const handleNav = (newView) => {
        if (newView === 'detail' && selectedIssueId) {
            setView('detail');
        } else {
            setSelectedIssueId(null);
            setView(newView);
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[2900] transition-opacity duration-300 md:hidden ${
                    isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className={`fixed inset-y-0 left-0 z-[3000] flex w-64 flex-col border-r border-white/10 bg-slate-950/90 backdrop-blur-2xl transition-transform duration-300 ease-out md:translate-x-0 ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 px-5">
                    <span className="text-xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-slate-200">
                        🌍 FixMyWorld
                    </span>
                    <button type="button" className="text-slate-400 hover:text-white md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto py-4 px-3">
                    <nav className="space-y-1.5">
                        <NavItem label="Dashboard" icon={<IconDashboard className="w-5 h-5" />} isActive={view === 'dashboard' || view === 'detail'} onClick={() => handleNav('dashboard')} />
                        <NavItem label="Analytics" icon={<IconAnalytics className="w-5 h-5" />} isActive={view === 'analytics'} onClick={() => handleNav('analytics')} />
                        <NavItem label="Report Issue" icon={<IconReport className="w-5 h-5" />} isActive={view === 'report'} onClick={() => handleNav('report')} />
                    </nav>
                </div>

                {user && (
                    <div className="border-t border-white/10 p-4 bg-black/40 backdrop-blur-md">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-slate-700 flex items-center justify-center font-bold text-white text-xs shadow-md">
                                {user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">User Session</p>
                                <p className="text-xs font-bold text-slate-200 truncate">{user.email}</p>
                            </div>
                        </div>

                        <div className="space-y-1 mb-3">
                            <label className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Display Name</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={onNameChange}
                                className="glass-input block w-full rounded-xl text-xs p-2.5 font-medium"
                                placeholder="Set display name..."
                            />
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 py-2 text-xs font-semibold hover:bg-rose-500/20 transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};
