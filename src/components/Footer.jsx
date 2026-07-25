import React from 'react';

export const Footer = ({ weather }) => (
    <footer className="flex-none border-t border-white/10 bg-slate-950/70 p-4 text-center backdrop-blur-xl mb-14 md:mb-0">
        <p className="text-gray-400 text-xs">© 2026 FIXMYWORLD • Built with React & Capacitor by Vikash Saini</p>
        {weather && (
            <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] text-cyan-400 font-mono font-medium">
                <span>{weather.condition}</span>
                <span className="text-gray-600">•</span>
                <span>{weather.temp_c}°C</span>
                <span className="text-gray-600">•</span>
                <span>Humidity: {weather.humidity}%</span>
            </div>
        )}
    </footer>
);
