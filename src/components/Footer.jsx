import React from 'react';

export const Footer = ({ weather }) => (
    <footer className="flex-none border-t border-gray-800 bg-black/80 p-6 text-center backdrop-blur-md">
        <p className="text-gray-500 text-sm">© 2025 FIXMYWORLD. Built for a better tomorrow by Vikash Saini.</p>
        {weather && (
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-cyan-600 font-mono">
                <span>{weather.condition}</span>
                <span>•</span>
                <span>{weather.temp_c}°C</span>
                <span>•</span>
                <span>Hum: {weather.humidity}%</span>
            </div>
        )}
    </footer>
);
