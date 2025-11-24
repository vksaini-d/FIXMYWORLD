import React from 'react';
import { HomeIcon, ChartIcon, PlusIcon, XIcon } from '../icons/Icons';

const NavItem = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`group flex w-full items-center space-x-3 rounded-lg px-3 py-3 text-base font-semibold transition-all duration-300 hover:scale-105 hover:bg-cyan-500/20 ${isActive
                ? 'bg-cyan-500/20 text-cyan-300 shadow-[inset_0_0_10px_rgba(14,165,233,0.5)] border border-cyan-500/50'
                : 'text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400'
            }`}
    >
        <span className={isActive ? 'text-cyan-300' : 'text-gray-500 group-hover:text-cyan-400'}>
            {React.cloneElement(icon, { width: 20, height: 20 })}
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
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[2900] transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            <div className={`fixed inset-y-0 left-0 z-[3000] flex w-64 flex-col border-r border-cyan-500/30 bg-black/80 backdrop-blur-xl transition-transform duration-300 ease-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-cyan-500/30 px-4">
                    <span className="text-2xl font-orbitron font-extrabold text-cyan-400" style={{ textShadow: '0 0 5px #0ea5e9' }}>🌍 FixMyWorld</span>
                    <button type="button" className="text-cyan-400 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
                        <XIcon />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto py-2">
                    <nav className="space-y-1 px-2">
                        <NavItem label="Dashboard" icon={<HomeIcon />} isActive={view === 'dashboard' || view === 'detail'} onClick={() => handleNav('dashboard')} />
                        <NavItem label="Analytics" icon={<ChartIcon />} isActive={view === 'analytics'} onClick={() => handleNav('analytics')} />
                        <NavItem label="Report Issue" icon={<PlusIcon />} isActive={view === 'report'} onClick={() => handleNav('report')} />
                    </nav>
                </div>
                {user && (
                    <div className="border-t border-cyan-500/30 p-4 bg-gray-900/40">
                        <div className="mb-3 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500"></div>
                            <div className="overflow-hidden">
                                <p className="text-xs text-gray-400">Logged in as:</p>
                                <p className="text-sm font-bold text-white truncate">{user.email}</p>
                            </div>
                        </div>
                        <label className="block text-xs text-gray-400">Display Name</label>
                        <input
                            type="text"
                            value={userName}
                            onChange={onNameChange}
                            className="mt-1 mb-3 block w-full rounded-md border-cyan-500/50 bg-gray-800 text-white text-xs p-1 focus:border-cyan-500"
                            placeholder="Enter name"
                        />
                        <button onClick={handleLogout} className="w-full rounded border border-red-500/50 text-red-400 py-1 text-xs hover:bg-red-900/20">Sign Out</button>
                    </div>
                )}
            </div>
        </>
    );
};
