import React from 'react';

export const WeatherEffects = ({ weatherCondition }) => {
    if (!weatherCondition) return null;
    const lower = weatherCondition.toLowerCase();
    let effectClass = '';
    let key = '';

    if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('patchy rain')) {
        effectClass = 'bg-blue-900/50 mix-blend-overlay';
        key = 'rain';
    } else if (lower.includes('mist') || lower.includes('fog') || lower.includes('haze')) {
        effectClass = 'bg-gray-500/40 backdrop-blur-[4px]';
        key = 'mist';
    } else if (lower.includes('sunny') || lower.includes('clear')) {
        effectClass = 'bg-yellow-500/20 mix-blend-overlay';
        key = 'sunny';
    } else if (lower.includes('cloudy') || lower.includes('overcast')) {
        effectClass = 'bg-gray-800/40 mix-blend-overlay';
        key = 'cloudy';
    } else if (lower.includes('snow') || lower.includes('sleet') || lower.includes('ice')) {
        effectClass = 'bg-white/50 backdrop-blur-[3px]';
        key = 'snow';
    } else if (lower.includes('thunder') || lower.includes('storm') || lower.includes('lightning') || lower.includes('tornado')) {
        effectClass = 'bg-red-900/40 mix-blend-overlay animate-pulse-strong';
        key = 'storm';
    }

    return <div key={key} className={`pointer-events-none fixed inset-0 z-0 ${effectClass}`}></div>;
};
