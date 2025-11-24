import React from 'react';
import { MenuIcon } from '../icons/Icons';

export const MobileHeader = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => (
    <div className="flex-none flex h-16 items-center justify-between border-b border-cyan-500/30 bg-gray-900/70 backdrop-blur-xl md:hidden relative z-[2000]">
        <div className="pl-4">
            <span className="text-2xl font-orbitron font-extrabold text-cyan-400" style={{ textShadow: '0 0 5px #0ea5e9' }}>🌍 FixMyWorld</span>
        </div>
        <button type="button" className="px-4 text-cyan-400" onClick={() => setIsMobileMenuOpen(true)}>
            <MenuIcon />
        </button>
    </div>
);
