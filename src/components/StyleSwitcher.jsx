import React from 'react';
import { MoonIcon, MapIcon, SatelliteIcon, MountainIcon } from '../icons/Icons';

export const StyleSwitcher = ({ currentStyle, setStyle }) => {
    const styles = [
        { id: 'dark', label: 'Dark', icon: <MoonIcon /> },
        { id: 'street', label: 'Street', icon: <MapIcon /> },
        { id: 'satellite', label: 'Sat', icon: <SatelliteIcon /> },
        { id: 'terrain', label: 'Terra', icon: <MountainIcon /> },
    ];

    return (
        <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', marginTop: '60px', marginRight: '10px' }}>
            <div className="leaflet-control flex flex-col gap-2 rounded-xl border border-cyan-500/30 bg-gray-900/90 p-2 shadow-[0_0_20px_rgba(14,165,233,0.2)] backdrop-blur-xl">
                {styles.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setStyle(s.id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 ${currentStyle === s.id
                                ? 'bg-cyan-500 text-black shadow-[0_0_10px_#0ea5e9]'
                                : 'bg-transparent text-gray-400 hover:bg-cyan-900/50 hover:text-cyan-300'
                            }`}
                        title={s.label}
                    >
                        {s.icon}
                    </button>
                ))}
            </div>
        </div>
    );
};
